-- CORREÇÃO ESPECÍFICA PARA CRIAÇÃO DE POSTS
-- Execute este script se estiver tendo problemas ao criar publicações

-- 1. Garantir que a tabela posts existe e tem a estrutura correta
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ativar RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- 3. Remover políticas antigas que podem estar causando conflito
DROP POLICY IF EXISTS "Posts são públicos" ON public.posts;
DROP POLICY IF EXISTS "Autenticados criam posts" ON public.posts;
DROP POLICY IF EXISTS "Dono deleta post" ON public.posts;
DROP POLICY IF EXISTS "Usuários podem criar posts" ON public.posts;
DROP POLICY IF EXISTS "Usuários podem deletar os próprios posts" ON public.posts;
DROP POLICY IF EXISTS "Qualquer um pode ver posts" ON public.posts;

-- 4. Criar políticas corretas
CREATE POLICY "Posts são públicos" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Autenticados criam posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono deleta post" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Dono atualiza post" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Verificar se o trigger de updated_at existe
DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Verificar permissões da tabela
GRANT ALL ON public.posts TO authenticated;
GRANT SELECT ON public.posts TO anon;

-- FIM - Agora tente criar um post novamente
