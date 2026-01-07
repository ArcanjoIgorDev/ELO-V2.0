-- ============================================
-- ELO NETWORK - SETUP COMPLETO DO BANCO DE DADOS
-- Desenvolvido por: Igor Arcanjo
-- ============================================

-- 1. CRIAR EXTENSÕES NECESSÁRIAS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÃO PARA ATUALIZAR updated_at AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TABELA DE PERFIS
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    has_seen_tutorial BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis públicos" ON public.profiles;
CREATE POLICY "Perfis públicos" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários editam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários editam próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Usuários criam próprio perfil" ON public.profiles;
CREATE POLICY "Usuários criam próprio perfil" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. TABELA DE POSTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts públicos" ON public.posts;
CREATE POLICY "Posts públicos" ON public.posts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criar posts" ON public.posts;
CREATE POLICY "Criar posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Deletar próprios posts" ON public.posts;
CREATE POLICY "Deletar próprios posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS posts_updated_at ON public.posts;
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 5. TABELA DE CURTIDAS
-- ============================================
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Curtidas públicas" ON public.likes;
CREATE POLICY "Curtidas públicas" ON public.likes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criar curtidas" ON public.likes;
CREATE POLICY "Criar curtidas" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Deletar curtidas" ON public.likes;
CREATE POLICY "Deletar curtidas" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. TABELA DE COMENTÁRIOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comentários públicos" ON public.comments;
CREATE POLICY "Comentários públicos" ON public.comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criar comentários" ON public.comments;
CREATE POLICY "Criar comentários" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Deletar comentários" ON public.comments;
CREATE POLICY "Deletar comentários" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 7. TABELA DE CONEXÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver conexões" ON public.connections;
CREATE POLICY "Ver conexões" ON public.connections FOR SELECT 
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Criar conexões" ON public.connections;
CREATE POLICY "Criar conexões" ON public.connections FOR INSERT 
    WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "Atualizar conexões" ON public.connections;
CREATE POLICY "Atualizar conexões" ON public.connections FOR UPDATE 
    USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Deletar conexões" ON public.connections;
CREATE POLICY "Deletar conexões" ON public.connections FOR DELETE 
    USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- ============================================
-- 8. TABELA DE MENSAGENS
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver mensagens" ON public.messages;
CREATE POLICY "Ver mensagens" ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Enviar mensagens" ON public.messages;
CREATE POLICY "Enviar mensagens" ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Marcar lida" ON public.messages;
CREATE POLICY "Marcar lida" ON public.messages FOR UPDATE 
    USING (auth.uid() = receiver_id);

-- ============================================
-- 9. TABELA DE NOTIFICAÇÕES
-- ============================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver notificações" ON public.notifications;
CREATE POLICY "Ver notificações" ON public.notifications FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Atualizar notificações" ON public.notifications;
CREATE POLICY "Atualizar notificações" ON public.notifications FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Criar notificações" ON public.notifications;
CREATE POLICY "Criar notificações" ON public.notifications FOR INSERT 
    WITH CHECK (true);

-- ============================================
-- 10. STORAGE (BUCKET AVATARS)
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Imagens públicas" ON storage.objects;
CREATE POLICY "Imagens públicas" ON storage.objects FOR SELECT 
    USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Upload autenticado" ON storage.objects;
CREATE POLICY "Upload autenticado" ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deletar próprias imagens" ON storage.objects;
CREATE POLICY "Deletar próprias imagens" ON storage.objects FOR DELETE 
    USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- ============================================
-- CONCLUÍDO! Execute este script no SQL Editor do Supabase
-- ============================================
