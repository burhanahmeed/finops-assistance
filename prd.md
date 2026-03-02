# Mayar merchant assistant

This is a chatbot interface that helps merchants manage their Mayar accounts like creating products, managing orders, and handling payments, generate reports, and more.

# Goals

- Help merchants manage their Mayar accounts
- Provide a chatbot interface for merchants to interact with
- Allow merchants to create products, manage orders, and handle payments
- Generate reports for merchants like sales, orders, and inventory
- Provide support for merchants with any questions or issues they may have

# Features

## 1. chat product management 
- Merchant can throw a csv file or raw text to create products
- Merchant can update product information like price, stock, and description
- Merchant can delete products

## 2. chat transaction summary
- Merchant can ask for a summary of their transactions like total sales, total orders, and total payments
- Merchant can filter the summary by date range

# Tech Stack
- Frontend: React
- Backend: Node.js, Fastify
- LLM: Gemini
- Mayar MCP

# Limitation

Since this is for hackathon purpose, the data will be stored in localstorage browser or in memory.

# User Flow

1. Merchant access the webpage
2. Merchant enter Mayar API key and Gemini API
3. Merchant enter the app
4. The system show the chat interface like ChatGPT
5. Merchant can use "/" command
6. The system show the available commands like "/create_product", "/update_product", "/delete_product", "/transaction_summary"
7.  Merchant can use direct text without command also
