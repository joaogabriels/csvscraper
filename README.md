Essa é a solução do desafio técnico.

## Desafio

O desafio consiste em criar uma aplicação que consiga fazer a leitura de uma planilha, e a partir de uma coluna contendo um link de uma página, buscar atributos específicos dessa página e atualizar a planilha com esses atributos.

Link da planilha: [Planilha](https://docs.google.com/spreadsheets/d/1T7PMFVrtUGhuagZOw1FlBGIP8uDbVWkofMH4nqNVJtw/edit?gid=1153201761#gid=1153201761)

## Como rodar o projeto

### Requisitos
- Criar uma conta na [Vercel](https://vercel.com/)
- Possuir o [Node.js](https://nodejs.org/en/) instalado na LTS mais recente.
- Para que o puppeteer funcione corretamente, é necessário disponibilizar o binário do chromium nesse ambiente, para isso, é necessário hospedar o binário em alguma plataforma de storage, como a própria Vercel, ou o Google Cloud Storage, S3, etc. O binário do chromium pode ser encontrado [aqui](https://github.com/Sparticuz/chromium/releases/tag/v131.0.1). Você usara o link desse binário no arquivo `.env.local` na variável `CHROMIUM_URL`.

### Passo a passo

1. Com sua conta na Vercel criada, crie uma novo storage blob na [Vercel](https://vercel.com/storage/blob);
2. Clone o repositório, e acesse a pasta do projeto;
3. Instale as dependências do projeto com o comando `npm install`;
4. Copie o arquivo `.env.example` para `.env.local` com o comando `cp .env.example .env.local`;
5. Preencha o arquivo `.env.local` com as informações necessárias;
6. Rodar o comando `npm run dev` para rodar o projeto localmente;
7. Acesse o endereço `http://localhost:3000` para visualizar o projeto.
