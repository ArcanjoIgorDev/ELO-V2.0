-- CORREÇÃO DEFINITIVA PARA POSTS
-- Este script resolve o problema de criação de posts de forma definitiva

-- 1. Verificar e criar a função handle_updated_at se não existir
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Recriar a tabela posts com a estrutura correta
DROP TABLE IF EXISTS public.posts CASCADE;

CREATE TABLE public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- 3. Ativar RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas simples e funcionais
CREATE POLICY "allow_select_posts" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "allow_insert_posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "allow_delete_own_posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "allow_update_own_posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Criar trigger para updated_at
CREATE TRIGGER posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Garantir permissões
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- Pronto! Agora teste criar um post
