# ELO V2 - Setup & Deploy

Este projeto está configurado para ser implantado facilmente na Vercel e otimizado para dispositivos móveis.

## 🚀 Como fazer Deploy ("Zero Config")

Como você quer facilidade, aqui está o fluxo mais simples possível:

1. **Crie um Repositório no GitHub** e envie este código para lá.
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
   git push -u origin main
   ```

2. **Conecte na Vercel**:
   - Acesse [vercel.com](https://vercel.com) e faça login.
   - Clique em "Add New..." -> "Project".
   - Importe o repositório do GitHub que você acabou de criar.

3. **Configure as Variáveis de Ambiente**:
   - Na tela de configuração do projeto na Vercel (antes de clicar em Deploy), procure a seção **Environment Variables**.
   - Adicione as seguintes chaves (copie os valores do arquivo `.env` que gerei para você):
     - `VITE_SUPABASE_URL`
     - `VITE_SUPABASE_ANON_KEY`

4. **Clique em Deploy**:
   - A Vercel vai instalar as dependências, construir o projeto e publicar automaticamente.
   - Sempre que você fizer um `git push` no GitHub, a Vercel vai atualizar o site sozinha!

## 📱 Mobile First

O projeto foi otimizado para mobile com:
- **Safe Area Support**: Prevê o "notch" e a barra inferior do iPhone (`pt-safe`, `pb-safe`).
- **Touch Targets**: Botões com tamanho adequado para o toque.
- **Pull to Refresh**: Funcionalidade nativa de arrastar para atualizar no Feed.
- **PWA Ready**: Meta tags configuradas para funcionar como app se adicionado à tela inicial.

## 🛠 Comandos Locais (Opcional)

Se você instalar o Node.js no futuro:
- `npm install` (Instalar dependências)
- `npm run dev` (Rodar localmente)
- `npm run build` (Gerar versão de produção)
