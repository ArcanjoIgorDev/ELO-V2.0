-- ELO NETWORK - FUNCIONALIDADES INOVADORAS
-- Este script adiciona novas funcionalidades inovadoras ao ELO
-- Execute após supabase_setup.sql e security_improvements.sql

-- 1. TABELA DE STATUS DE ATIVIDADE (ONLINE/OFFLINE)
CREATE TABLE IF NOT EXISTS public.user_activity (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE PRIMARY KEY,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    status_message TEXT CHECK (status_message IS NULL OR (char_length(status_message) >= 1 AND char_length(status_message) <= 100)),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver status de atividade de outros usuários" ON public.user_activity;
CREATE POLICY "Ver status de atividade de outros usuários" ON public.user_activity
    FOR SELECT USING (true); -- Todos podem ver status de atividade

DROP POLICY IF EXISTS "Inserir próprio status" ON public.user_activity;
CREATE POLICY "Inserir próprio status" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Atualizar próprio status" ON public.user_activity;
CREATE POLICY "Atualizar próprio status" ON public.user_activity
    FOR UPDATE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS set_user_activity_updated_at ON public.user_activity;
CREATE TRIGGER set_user_activity_updated_at
    BEFORE UPDATE ON public.user_activity
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. TABELA DE REAÇÕES AVANÇADAS (além de like)
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'fire', 'mind_blown', 'support', 'insightful')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id, reaction_type)
);

ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reações públicas" ON public.post_reactions;
CREATE POLICY "Reações públicas" ON public.post_reactions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Criar reações" ON public.post_reactions;
CREATE POLICY "Criar reações" ON public.post_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Remover próprias reações" ON public.post_reactions;
CREATE POLICY "Remover próprias reações" ON public.post_reactions
    FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON public.post_reactions(reaction_type);

-- 3. TABELA DE VIBES (Ondas de Sentimento)
CREATE TABLE IF NOT EXISTS public.post_vibes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
    vibe_type TEXT NOT NULL CHECK (vibe_type IN ('positive', 'neutral', 'contemplative', 'energetic', 'calm', 'excited', 'motivational', 'curious')),
    confidence FLOAT DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id)
);

ALTER TABLE public.post_vibes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vibes públicas" ON public.post_vibes;
CREATE POLICY "Vibes públicas" ON public.post_vibes
    FOR SELECT USING (true);

-- Política de INSERT/UPDATE removida - apenas triggers SECURITY DEFINER podem criar/atualizar vibes
-- Isso garante que apenas o sistema pode criar vibes, não usuários diretamente

DROP TRIGGER IF EXISTS set_post_vibes_updated_at ON public.post_vibes;
CREATE TRIGGER set_post_vibes_updated_at
    BEFORE UPDATE ON public.post_vibes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_post_vibes_post_id ON public.post_vibes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_vibes_type ON public.post_vibes(vibe_type);

-- 4. FUNÇÃO PARA ANALISAR VIBE DE UM POST (análise simples baseada em palavras-chave)
CREATE OR REPLACE FUNCTION public.analyze_post_vibe(post_content TEXT)
RETURNS TEXT AS $$
DECLARE
    content_lower TEXT;
    vibe_result TEXT;
BEGIN
    content_lower := LOWER(post_content);
    
    -- Palavras-chave para diferentes vibes
    IF content_lower ~ '(feliz|alegre|incrível|fantástico|amor|gratidão|felicidade|ótimo|maravilhoso|perfeito|sucesso|venci|conquistei)' THEN
        vibe_result := 'positive';
    ELSIF content_lower ~ '(fogo|🔥|incrível|insano|épico|bombando|quente|top|fodástico)' THEN
        vibe_result := 'energetic';
    ELSIF content_lower ~ '(pensando|refletindo|questionando|por que|como|porquê|filosofia|ideia|pensamento)' THEN
        vibe_result := 'contemplative';
    ELSIF content_lower ~ '(calma|tranquilo|paz|sereno|relaxado|zen|respirar|meditar)' THEN
        vibe_result := 'calm';
    ELSIF content_lower ~ '(excitado|animiado|ansioso|aguardando|esperando|chegando|próximo|lançamento)' THEN
        vibe_result := 'excited';
    ELSIF content_lower ~ '(motivação|vamos|força|determinação|nunca desista|continue|foco|objetivo|meta|conquista)' THEN
        vibe_result := 'motivational';
    ELSIF content_lower ~ '(curioso|interessante|aprendendo|descobrindo|novo|diferente|como funciona)' THEN
        vibe_result := 'curious';
    ELSE
        vibe_result := 'neutral';
    END IF;
    
    RETURN vibe_result;
END;
$$ LANGUAGE plpgsql;

-- 5. TRIGGER PARA CRIAR VIBE AUTOMATICAMENTE QUANDO UM POST É CRIADO
CREATE OR REPLACE FUNCTION public.auto_create_post_vibe()
RETURNS TRIGGER AS $$
DECLARE
    detected_vibe TEXT;
BEGIN
    detected_vibe := public.analyze_post_vibe(NEW.content);
    
    INSERT INTO public.post_vibes (post_id, vibe_type, confidence)
    VALUES (NEW.id, detected_vibe, 0.7)
    ON CONFLICT (post_id) DO UPDATE
    SET vibe_type = detected_vibe,
        confidence = 0.7,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS auto_create_post_vibe_trigger ON public.posts;
CREATE TRIGGER auto_create_post_vibe_trigger
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_create_post_vibe();

-- 6. TABELA DE BADGES/CONQUISTAS
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL CHECK (badge_type IN ('first_post', 'first_connection', 'popular_post', 'active_user', 'early_adopter', 'community_builder', 'thought_leader')),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, badge_type)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Badges públicos" ON public.user_badges;
CREATE POLICY "Badges públicos" ON public.user_badges
    FOR SELECT USING (true);

-- Política de INSERT removida - apenas triggers SECURITY DEFINER podem criar badges
-- Isso garante que apenas o sistema pode criar badges, não usuários diretamente

CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);

-- 7. FUNÇÃO PARA VERIFICAR E ATRIBUIR BADGES AUTOMATICAMENTE
CREATE OR REPLACE FUNCTION public.check_and_award_badges(p_user_id UUID)
RETURNS void AS $$
DECLARE
    posts_count INTEGER;
    connections_count INTEGER;
    likes_count INTEGER;
BEGIN
    -- Contar posts do usuário
    SELECT COUNT(*) INTO posts_count FROM public.posts WHERE user_id = p_user_id;
    
    -- Contar conexões aceitas
    SELECT COUNT(*) INTO connections_count FROM public.connections
    WHERE (requester_id = p_user_id OR receiver_id = p_user_id) AND status = 'accepted';
    
    -- Verificar primeiro post
    IF posts_count = 1 AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_type = 'first_post') THEN
        INSERT INTO public.user_badges (user_id, badge_type)
        VALUES (p_user_id, 'first_post')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Verificar primeira conexão
    IF connections_count = 1 AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_type = 'first_connection') THEN
        INSERT INTO public.user_badges (user_id, badge_type)
        VALUES (p_user_id, 'first_connection')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Verificar usuário ativo (10+ posts)
    IF posts_count >= 10 AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_type = 'active_user') THEN
        INSERT INTO public.user_badges (user_id, badge_type)
        VALUES (p_user_id, 'active_user')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Verificar post popular (100+ curtidas em um post)
    SELECT COUNT(*) INTO likes_count FROM public.likes l
    JOIN public.posts p ON p.id = l.post_id
    WHERE p.user_id = p_user_id
    GROUP BY p.id
    HAVING COUNT(*) >= 100
    LIMIT 1;
    
    IF likes_count > 0 AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_type = 'popular_post') THEN
        INSERT INTO public.user_badges (user_id, badge_type)
        VALUES (p_user_id, 'popular_post')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
    
    -- Verificar construtor da comunidade (20+ conexões)
    IF connections_count >= 20 AND NOT EXISTS (SELECT 1 FROM public.user_badges WHERE user_id = p_user_id AND badge_type = 'community_builder') THEN
        INSERT INTO public.user_badges (user_id, badge_type)
        VALUES (p_user_id, 'community_builder')
        ON CONFLICT (user_id, badge_type) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. TRIGGER PARA VERIFICAR BADGES APÓS CRIAÇÃO DE POST
CREATE OR REPLACE FUNCTION public.check_badges_after_post()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.check_and_award_badges(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_badges_after_post_trigger ON public.posts;
CREATE TRIGGER check_badges_after_post_trigger
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.check_badges_after_post();

-- 9. TRIGGER PARA VERIFICAR BADGES APÓS CONEXÃO ACEITA
CREATE OR REPLACE FUNCTION public.check_badges_after_connection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        PERFORM public.check_and_award_badges(NEW.requester_id);
        PERFORM public.check_and_award_badges(NEW.receiver_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS check_badges_after_connection_trigger ON public.connections;
CREATE TRIGGER check_badges_after_connection_trigger
    AFTER UPDATE ON public.connections
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.check_badges_after_connection();

-- 10. TRIGGER PARA ATUALIZAR STATUS DE ATIVIDADE
CREATE OR REPLACE FUNCTION public.update_user_activity_on_login()
RETURNS TRIGGER AS $$
BEGIN
    -- Quando usuário faz login (ou refresh de token), atualiza status
    INSERT INTO public.user_activity (user_id, is_online, last_seen)
    VALUES (NEW.id, TRUE, NOW())
    ON CONFLICT (user_id) DO UPDATE
    SET is_online = TRUE,
        last_seen = NOW(),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. FUNÇÃO PARA MARCAR USUÁRIO COMO OFFLINE APÓS 5 MINUTOS DE INATIVIDADE
-- Esta função deve ser chamada periodicamente ou via cron job
CREATE OR REPLACE FUNCTION public.mark_inactive_users_offline()
RETURNS void AS $$
BEGIN
    UPDATE public.user_activity
    SET is_online = FALSE,
        updated_at = NOW()
    WHERE is_online = TRUE
    AND last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- FIM DAS FUNCIONALIDADES INOVADORAS
