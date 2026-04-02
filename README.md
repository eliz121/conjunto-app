# 🏘️ Sistema de Administración de Condominios

Sistema web desarrollado para la gestión administrativa del 
Conjunto Habitacional San Felipe, reemplazando el control 
manual en Excel por una plataforma digital centralizada.

## 🛠️ Stack

- **Frontend**: Next.js 14 + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Estilos**: Tailwind CSS

## ✨ Funcionalidades

- 🔐 Autenticación con roles (admin / vecino)
- 📊 Matriz de pagos tipo Excel por casa y mes
- 💰 Registro de alícuotas, parqueaderos y conceptos especiales
- 📄 Gestión de comprobantes y recibos
- 📋 Liquidación mensual (ingresos, egresos, saldo)
- 👤 Portal del vecino — pagos, deudas y recibos propios
- 📢 Cartelera de documentos y avisos generales
- 🤖 Predicción de morosos con Machine Learning *(en desarrollo)*

## 🚀 Instalación

1. Clona el repositorio
   git clone https://github.com/eliz121/conjunto-app.git

2. Instala dependencias
   npm install

3. Configura variables de entorno
   cp .env.example .env.local
   Credenciales de Supabase
  
5. Corre el proyecto
   npm run dev

## 👥 Roles

| Rol | Acceso |
|-----|--------|
| Admin | Dashboard completo, registro de pagos y egresos |
| Vecino | Sus pagos, deudas y documentos generales |
