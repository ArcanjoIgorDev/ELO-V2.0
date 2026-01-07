-- ELO NETWORK - PRODUCTION DATABASE SETUP
-- Responsável: Igor Arcanjo
-- Descrição: Configuração completa de tabelas, RLS, Baldes de Storage e Triggers.

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. FUNÇÃO PARA UPDATED_AT
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. TABELA DE PERFIS (PROFILES)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
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

CREATE POLICY "Perfis são públicos" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Usuários editam o próprio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Inserção automática via trigger ou auth" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 3. TABELA DE POSTAGENS (POSTS)
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

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Posts são públicos" ON public.posts
    FOR SELECT USING (true);

CREATE POLICY "Autenticados criam posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Dono deleta post" ON public.posts
    FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER set_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. TABELA DE CURTIDAS (LIKES)
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes públicos" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Autenticados curtem" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono remove curtida" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- 5. TABELA DE COMENTÁRIOS (COMMENTS)
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Comentários públicos" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Autenticados comentam" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono deleta comentário" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 6. TABELA DE CONEXÕES (CONNECTIONS)
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, accepted, declined, blocked
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver próprias conexões" ON public.connections
    FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

CREATE POLICY "Criar pedido de conexão" ON public.connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Atualizar status de conexão" ON public.connections
    FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

CREATE POLICY "Deletar conexão" ON public.connections
    FOR DELETE USING (auth.uid() = requester_id OR auth.uid() = receiver_id);

-- 7. TABELA DE MENSAGENS (MESSAGES)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver mensagens próprias" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Enviar mensagens" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Marcar como lida" ON public.messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- 8. TABELA DE NOTIFICAÇÕES (NOTIFICATIONS)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    reference_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver próprias notificações" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Atualizar própria notificação" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 9. TABELA DE ECHOS (VIBES 24H)
CREATE TABLE IF NOT EXISTS public.echos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text', -- text, image
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.echos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Echos públicos" ON public.echos FOR SELECT USING (true);
CREATE POLICY "Dono cria echo" ON public.echos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Dono deleta echo" ON public.echos FOR DELETE USING (auth.uid() = user_id);

-- 10. STORAGE POLICIES (Balde 'avatars')
-- O bucket 'avatars' deve ser criado manualmente como PÚBLICO no dashboard.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public) 
    VALUES ('avatars', 'avatars', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

CREATE POLICY "Imagens públicas" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Upload permitido para autenticados" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

CREATE POLICY "Gestão de arquivos próprios" ON storage.objects
    FOR ALL USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- FIM DO SCRIPT