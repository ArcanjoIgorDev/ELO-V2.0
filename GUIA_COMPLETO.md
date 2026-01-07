# 🚀 GUIA COMPLETO DE CONFIGURAÇÃO - ELO V2.0

## ⚠️ IMPORTANTE: Siga os passos NA ORDEM

---

## 📋 PASSO 1: Configurar o Banco de Dados no Supabase

1. **Acesse seu projeto no Supabase** (https://supabase.com)
2. **Vá em SQL Editor** (menu lateral esquerdo)
3. **Clique em "New Query"**
4. **Copie TODO o conteúdo do arquivo `supabase_complete_setup.sql`**
5. **Cole no editor e clique em "RUN"**
6. **Aguarde a mensagem de sucesso**

✅ **Isso vai criar:**
- Todas as tabelas (profiles, posts, likes, comments, connections, messages, notifications)
- Todas as políticas de segurança (RLS)
- O bucket de storage para avatars
- Triggers automáticos

---

## 📋 PASSO 2: Configurar o Storage (Bucket de Imagens)

1. **No Supabase, vá em "Storage"** (menu lateral)
2. **Verifique se o bucket "avatars" foi criado**
3. **Se NÃO existir, clique em "New Bucket":**
   - Nome: `avatars`
   - Marque como **PUBLIC**
   - Clique em "Create Bucket"

---

## 📋 PASSO 3: Testar o App

### 3.1 Criar sua primeira conta
1. Acesse o app no Vercel
2. Clique em "Criar Conta"
3. Escolha um username (mínimo 3 caracteres)
4. Crie uma senha (mínimo 6 caracteres)
5. Clique em "Efetuar Registro"

### 3.2 Criar seu primeiro post
1. Após o login, você verá a tela "Oceano Calmo" (normal, não há posts ainda!)
2. Clique em "Criar Onda" ou no campo de texto
3. Escreva algo (ex: "Primeira onda no ELO! 🌊")
4. Clique em "Publicar"

✅ **Agora seu feed deve mostrar o post!**

---

## 🐛 PROBLEMAS COMUNS E SOLUÇÕES

### Problema: "Oceano muito agitado" ou erro no feed
**Solução:** Execute o script SQL novamente (Passo 1)

### Problema: Não consigo criar posts
**Solução:** 
1. Verifique se executou o SQL
2. Verifique se o bucket "avatars" existe
3. Tente fazer logout e login novamente

### Problema: Layout bugado na tela de login
**Solução:** Limpe o cache do navegador (Ctrl+Shift+Delete) e recarregue

### Problema: Chat não funciona
**Solução:** O chat só funciona entre usuários conectados. Primeiro:
1. Crie duas contas diferentes
2. Use a aba "Descobrir" para buscar o outro usuário
3. Envie um pedido de conexão
4. Aceite a conexão
5. Agora pode usar o chat!

---

## 📱 TESTANDO NO MOBILE

### Android/iPhone:
1. Abra o app no navegador do celular
2. No Chrome: Menu → "Adicionar à tela inicial"
3. No Safari: Compartilhar → "Adicionar à Tela de Início"

---

## 🎨 RECURSOS DO APP

✅ **Feed de Posts** - Compartilhe ideias e atualizações
✅ **Conexões** - Networking profissional
✅ **Chat Privado** - Mensagens entre conexões
✅ **Notificações** - Fique por dentro de tudo
✅ **Perfil Personalizável** - Avatar e bio
✅ **Design Ocean Glass** - Interface moderna e fluida

---

## 🔧 VARIÁVEIS DE AMBIENTE (Vercel)

Certifique-se de que estas variáveis estão configuradas no Vercel:

```
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

---

## 📞 PRÓXIMOS PASSOS

1. ✅ Execute o SQL no Supabase
2. ✅ Crie sua conta
3. ✅ Faça seu primeiro post
4. ✅ Explore as funcionalidades
5. ✅ Convide amigos para testar!

---

**Desenvolvido por Igor Arcanjo** 🌊
