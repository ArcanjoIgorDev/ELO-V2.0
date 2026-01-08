-- ELO NETWORK - MELHORIAS DE SEGURANÇA
-- Este script adiciona validações e políticas de segurança adicionais
-- Execute após o supabase_setup.sql

-- 1. ADICIONAR CONSTRAINTS DE VALIDAÇÃO NAS TABELAS

-- Validar conteúdo de posts (não vazio, máximo 500 caracteres)
ALTER TABLE public.posts 
  DROP CONSTRAINT IF EXISTS posts_content_length;
ALTER TABLE public.posts 
  ADD CONSTRAINT posts_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 500);

-- Validar conteúdo de comentários (não vazio, máximo 500 caracteres)
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_content_length;
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 500);

-- Validar conteúdo de mensagens (não vazio, máximo 1000 caracteres)
ALTER TABLE public.messages 
  DROP CONSTRAINT IF EXISTS messages_content_length;
ALTER TABLE public.messages 
  ADD CONSTRAINT messages_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 1000);

-- Validar bio (máximo 160 caracteres)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_bio_length;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 160);

-- Validar full_name (máximo 50 caracteres)
ALTER TABLE public.profiles 
  DROP CONSTRAINT IF EXISTS profiles_full_name_length;
ALTER TABLE public.profiles 
  ADD CONSTRAINT profiles_full_name_length CHECK (full_name IS NULL OR char_length(full_name) <= 50);

-- Validar echos (máximo 60 caracteres)
ALTER TABLE public.echos 
  DROP CONSTRAINT IF EXISTS echos_content_length;
ALTER TABLE public.echos 
  ADD CONSTRAINT echos_content_length CHECK (char_length(content) > 0 AND char_length(content) <= 60);

-- 2. ADICIONAR ÍNDICES PARA PERFORMANCE E SEGURANÇA

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_user_post ON public.likes(user_id, post_id);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_connections_requester ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON public.messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_read ON public.messages(receiver_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 3. POLÍTICA ADICIONAL PARA PREVENIR UPDATE DE POSTS POR OUTROS USUÁRIOS

DROP POLICY IF EXISTS "Dono atualiza post" ON public.posts;
CREATE POLICY "Dono atualiza post" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

-- 4. POLÍTICA PARA PREVENIR UPDATE DE COMENTÁRIOS POR OUTROS USUÁRIOS

DROP POLICY IF EXISTS "Dono atualiza comentário" ON public.comments;
CREATE POLICY "Dono atualiza comentário" ON public.comments
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. FUNÇÃO PARA VALIDAR CONEXÃO ANTES DE ENVIAR MENSAGEM (via trigger)

CREATE OR REPLACE FUNCTION public.validate_message_connection()
RETURNS TRIGGER AS $$
BEGIN
    -- Verificar se há conexão aceita entre sender e receiver
    IF NOT EXISTS (
        SELECT 1 FROM public.connections
        WHERE status = 'accepted'
        AND (
            (requester_id = NEW.sender_id AND receiver_id = NEW.receiver_id)
            OR (requester_id = NEW.receiver_id AND receiver_id = NEW.sender_id)
        )
    ) THEN
        RAISE EXCEPTION 'Usuários precisam estar conectados para trocar mensagens';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger para validar conexão antes de inserir mensagem
DROP TRIGGER IF EXISTS validate_message_connection_trigger ON public.messages;
CREATE TRIGGER validate_message_connection_trigger
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_message_connection();

-- 6. FUNÇÃO PARA LIMPAR ECHOS EXPIRADOS (executar periodicamente)

CREATE OR REPLACE FUNCTION public.cleanup_expired_echos()
RETURNS void AS $$
BEGIN
    DELETE FROM public.echos
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 7. POLÍTICA MELHORADA PARA STORAGE (prevenir path traversal)

DROP POLICY IF EXISTS "Gestão de arquivos próprios" ON storage.objects;
CREATE POLICY "Gestão de arquivos próprios" ON storage.objects
    FOR ALL 
    USING (
        bucket_id = 'avatars' 
        AND (
            -- Arquivo pertence ao usuário (formato: user_id-timestamp.ext)
            (storage.foldername(name))[1] = (auth.uid())::text
            OR name LIKE (auth.uid())::text || '-%'
            OR name LIKE (auth.uid())::text || '-cover-%'
        )
    );

-- 8. ADICIONAR VALIDAÇÃO DE TIPO DE NOTIFICAÇÃO

ALTER TABLE public.notifications 
  DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications 
  ADD CONSTRAINT notifications_type_check 
  CHECK (type IN ('like_post', 'like_comment', 'comment', 'request_received', 'request_accepted', 'request_declined', 'message'));

-- 9. ADICIONAR VALIDAÇÃO DE STATUS DE CONEXÃO

ALTER TABLE public.connections 
  DROP CONSTRAINT IF EXISTS connections_status_check;
ALTER TABLE public.connections 
  ADD CONSTRAINT connections_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'blocked'));

-- 10. PREVENIR AUTO-CONEXÃO

CREATE OR REPLACE FUNCTION public.prevent_self_connection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.requester_id = NEW.receiver_id THEN
        RAISE EXCEPTION 'Não é possível conectar-se a si mesmo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_self_connection_trigger ON public.connections;
CREATE TRIGGER prevent_self_connection_trigger
    BEFORE INSERT ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_self_connection();

-- FIM DAS MELHORIAS DE SEGURANÇA
