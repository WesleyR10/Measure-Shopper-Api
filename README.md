# Shopper Backend

## Descrição

Este projeto é o back-end de um serviço de leitura de imagens, desenvolvido utilizando a arquitetura DDD (Domain-Driven Design). O serviço gerencia a leitura individualizada de consumo de água e gás, utilizando IA para obter a medição através da foto de um medidor. A integração é feita com a API do Google Gemini.

## Arquitetura

O projeto foi desenvolvido seguindo os princípios de DDD (Domain-Driven Design), que ajuda a estruturar o código de forma modular e organizada, facilitando a manutenção e evolução do sistema.

## Inicialização do Projeto

Para iniciar o projeto, siga os passos abaixo:

1. Clone o repositório:

   ```sh
   git clone https://github.com/WesleyR10/Measure-Shopper-Api.git
   cd shopper-backend
   ```

2. Inicie o docker:

   ```sh
   docker-compose up -d
   ```

3. Instale as dependências:

````sh
npm install
```
4. Inicie o servidor em modo de desenvolvimento caso queira testar em modo local:

````sh
npm run start:dev
```

5. Para construir o projeto:

````sh
npm run build
```

6. Para iniciar o servidor em produção:d

````sh
npm start
```

````

