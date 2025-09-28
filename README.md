# React + TypeScript + Vite
# 🚀 Jogo de Palavras Escalável (AWS Serverless)

Um projeto *full-stack* desenvolvido para demonstrar a proficiência na construção e deploy de aplicações escaláveis utilizando a arquitetura Serverless da AWS. O jogo consiste na reordenação de letras para formar palavras válidas, com foco na performance e baixo custo operacional.

## 🎯 Objetivo do Projeto

1.  **Dominar o Serverless:** Provar a capacidade de configurar e orquestrar serviços Serverless (Lambda, DynamoDB) para criar uma API robusta.
2.  **Desenvolvimento Full-Stack:** Aplicar boas práticas de desenvolvimento Frontend (React/TypeScript) e Backend (Node.js/Lambda).
3.  **Escalabilidade e Custo:** Criar uma solução que escala automaticamente sem o custo fixo de servidores tradicionais.

## ⚙️ Tecnologias Utilizadas

| Categoria | Tecnologia | Uso |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript | Interface do usuário e lógica de reordenação de palavras. |
| **Infraestrutura** | AWS Lambda | Execução do código backend sem servidor (lógica de validação e interação com DB). |
| **Banco de Dados** | AWS DynamoDB (NoSQL) | Armazenamento das palavras, usuários e pontuação |
| **Distribuição** | AWS S3, CloudFront (CDN) | Hospedagem estática do frontend e entrega de conteúdo de baixa latência. |
| **API** | AWS API Gateway | Criação da interface de acesso à API Serverless. |

## 🏗️ Arquitetura da Solução

O projeto segue o padrão Serverless, onde o React é servido via S3/CDN. O frontend interage com o **API Gateway**, que aciona as funções **AWS Lambda** para processar a requisição e interagir com o **DynamoDB**.

## 🔗 Links

* **Demo Online:** https://d1rxd63kvexn53.cloudfront.net/
* **Visitar o Painel de Métricas:** 

***
*Desenvolvido com 💛 por ebneto*
