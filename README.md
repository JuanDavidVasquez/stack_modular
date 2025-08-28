# 📌 Node.js + TypeScript Modular API

Este proyecto es una **API** construida en **Node.js + TypeScript**, organizada de forma modular, inspirada en la arquitectura de **NestJS** y **Arquitectura Limpia**.  
Su objetivo es servir como **núcleo central** para manejar sesiones, seguridad, integración con APIs externas y un sistema escalable de módulos.

---

## 🚀 Características principales

- **Arquitectura modular** → cada módulo (users, auth, notifications, etc.) está desacoplado y es independiente.
- **Separación por capas** → `controllers`, `services`, `repositories`, `dtos`, `interfaces`.
- **Multi-idioma (i18n)** → soporta traducciones desde un directorio central.
- **Adapters** → permiten desacoplar librerías de terceros (`bcrypt`, `jwt`, `mailer`, etc.) para cambiarlas sin afectar el código.
- **Integración con APIs externas**:
  - Microservicio de notificaciones (emails, SMS, push, etc.).
  - Microservicio de storage (S3, etc.) para carga de archivos.
- **WebSockets** → comunicación en tiempo real.
- **Seguridad**:
  - Sesiones con **un solo login activo por usuario**.
  - Tokens con expiración.
  - Middleware y guards centralizados.
- **Submódulo de modelos compartidos (`models_stack`)**:
  - Contiene todos los modelos (User, Session, etc.) que se pueden reutilizar en otros microservicios.
  - Evita duplicación de código.

---

## 📂 Estructura de carpetas

```bash
src/
│
├── core/                          # Núcleo de la aplicación
│   ├── adapters/                   # Wrappers de librerías externas
│   │   ├── bcrypt.adapter.ts
│   │   ├── jwt.adapter.ts
│   │   ├── mailer.adapter.ts
│   │   └── index.ts
│   │
│   ├── config/                     # Configuración global (dotenv, db, etc.)
│   │   ├── database.ts
│   │   ├── env.ts
│   │   └── index.ts
│   │
│   ├── i18n/                       # Multi-idioma
│   │   ├── en.json
│   │   ├── es.json
│   │   └── index.ts
│   │
│   ├── middleware/                 # Middlewares globales
│   │   ├── auth.middleware.ts
│   │   └── logger.middleware.ts
│   │
│   ├── utils/                      # Utilidades generales
│   │   ├── date.util.ts
│   │   ├── response.util.ts
│   │   └── index.ts
│   │
│   ├── exceptions/                 # Manejo centralizado de errores
│   │   ├── http.exception.ts
│   │   └── index.ts
│   │
│   ├── guards/                     # Guards (ej: validación de sesión)
│   │   ├── session.guard.ts
│   │   └── index.ts
│   │
│   └── models_local/               # Modelos exclusivos de esta API
│       ├── audit-log.entity.ts
│       └── index.ts
│
├── modules/                        # Módulos principales
│   ├── auth/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── dtos/
│   │   └── interfaces/
│   │
│   ├── users/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   └── dtos/
│   │
│   ├── notifications/              # Cliente hacia microservicio externo
│   │   ├── controllers/
│   │   ├── services/
│   │   └── dtos/
│   │
│   ├── files/                      # Cliente hacia microservicio de storage
│   │   ├── controllers/
│   │   ├── services/
│   │   └── dtos/
│   │
│   └── sockets/                    # Tiempo real
│       ├── gateway.ts
│       └── events/
│
├── shared/                         # Código compartido interno
│   ├── dtos/
│   ├── interfaces/
│   └── constants/
│
├── models_stack/                   # Submódulo Git de modelos compartidos
│
├── app.module.ts                   # Registro de módulos
├── main.ts                         # Punto de entrada (bootstrap)
└── server.ts                       # Configuración de servidor (Express/Fastify)
```
## models_stack
```bash
├── entities/                         # Modelos base y extendidos
│   ├── base-user.model.ts
│   ├── user.model.ts
│   └── session.model.ts
│
├── shared/                           # Recursos compartidos entre modelos
│   ├── constants/                    # Constantes relacionadas a modelos
│   │   ├── user.constants.ts  
│   │   ├── session.constants.ts
│   │   └── index.ts
│   ├── enums/                        # Enums reutilizables
│   │   ├── user.enums.ts
│   │   ├── common.enums.ts
│   │   └── index.ts
│   ├── interfaces/                   # Interfaces base
│   │   ├── user.interfaces.ts
│   │   ├── common.interfaces.ts
│   │   └── index.ts
│   ├── helpers/                      # Funciones de ayuda específicas de modelos
│   │   ├── base-user.helpers.ts  
│   │   ├── user.helpers.ts
│   │   ├── validation.helpers.ts
│   │   └── index.ts
│   └── types/                        # Tipados derivados
│       ├── user.types.ts
│       └── index.ts
│
└── index.ts  
```


## https://localhost:4000/api/v1/user/create

**X-Language en**