# NestGram — Sequence Diagrams

> Generated: 2026-03-09

---

## Table of Contents

1. [Sign Up](#1-sign-up)
2. [Sign In](#2-sign-in)
3. [Authenticated Request (JWT + Redis)](#3-authenticated-request-jwt--redis-validation)
4. [Token Refresh](#4-token-refresh)
5. [Logout](#5-logout)
6. [File Upload to S3](#6-file-upload-to-s3)
7. [Create Post](#7-create-post)

---

### 1. Sign Up

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant VP as ValidationPipe
    participant AS as AuthService
    participant US as UserService
    participant DB as PostgreSQL

    Client->>API: POST /v1/auth/signup<br/>{email, username, password, role?}
    API->>VP: Validate CreateUserDto
    VP-->>API: Valid DTO
    API->>AS: signup(dto)
    AS->>US: createUser(dto)
    US->>US: bcrypt.hash(password, 11)
    US->>DB: prisma.user.create({email, username, hashedPassword, role})
    DB-->>US: User record
    US-->>AS: User
    AS-->>API: { success: true }
    API-->>Client: 201 { success: true }
```

---

### 2. Sign In

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AS as AuthService
    participant US as UserService
    participant DB as PostgreSQL
    participant Redis as Redis
    participant JWT as JwtService

    Client->>API: POST /v1/auth/signin<br/>{email, password}
    API->>AS: signin(dto)
    AS->>US: getUser({ email })
    US->>DB: prisma.user.findUnique({ email })
    DB-->>US: User | null
    US-->>AS: User | null

    alt User not found or password mismatch
        AS-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
    end

    AS->>AS: bcrypt.compare(password, user.password)

    AS->>AS: accessSid = uuid()
    AS->>AS: refreshSid = uuid()

    AS->>Redis: setJson("session:{userId}", {sid: accessSid}, 15min)
    AS->>Redis: setJson("refresh:{userId}", {sid: refreshSid}, 7days)

    AS->>JWT: sign({sub, email, sid: accessSid}, 15min) → access_token
    AS->>JWT: sign({sub, email, sid: refreshSid}, 7days) → refresh_token

    AS-->>API: { access_token, refresh_token }
    API->>API: res.cookie("access_token", ..., {httpOnly, secure, sameSite:lax, maxAge:15min})
    API->>API: res.cookie("refresh_token", ..., {httpOnly, secure, sameSite:lax, maxAge:7days})
    API-->>Client: 200 { success: true } + Set-Cookie headers
```

---

### 3. Authenticated Request (JWT + Redis Validation)

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AG as AuthGuard
    participant JWT as JwtService
    participant Redis as Redis
    participant Ctrl as Controller
    participant Svc as Service
    participant DB as PostgreSQL

    Client->>API: GET /v1/users/me<br/>Cookie: access_token=<jwt>
    API->>AG: canActivate(context)
    AG->>AG: Check @isPublic() decorator → not public

    AG->>AG: Extract access_token from cookies
    AG->>JWT: verify(token, JWT_SECRET) → payload {sub, email, sid}

    alt Invalid signature or expired
        AG-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
    end

    AG->>Redis: getJson("session:{sub}") → { sid: storedSid }

    alt Redis session missing
        AG-->>API: throw UnauthorizedException ("Session expired")
        API-->>Client: 401 Unauthorized
    end

    AG->>AG: Compare jwt.sid === storedSid

    alt SID mismatch (token reuse / replay)
        AG-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
    end

    AG->>API: req.user = payload → allow
    API->>Ctrl: getMe(userId)
    Ctrl->>Svc: getMe(userId)
    Svc->>DB: prisma.user.findUnique({ id })
    DB-->>Svc: User
    Svc-->>Ctrl: GetUserResponseDto
    Ctrl-->>API: DTO
    API-->>Client: 200 { id, email, username, role }
```

---

### 4. Token Refresh

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AS as AuthService
    participant JWT as JwtService
    participant Redis as Redis

    Client->>API: POST /v1/auth/refresh<br/>Cookie: refresh_token=<jwt>
    API->>AS: refresh(refresh_token)

    AS->>JWT: verify(refresh_token, JWT_SECRET) → payload {sub, email, sid}

    alt Invalid or expired
        AS-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
    end

    AS->>Redis: getJson("refresh:{sub}") → { sid: storedSid }

    alt No refresh session
        AS-->>API: throw UnauthorizedException
        API-->>Client: 401 Unauthorized
    end

    AS->>AS: newAccessSid = uuid()
    AS->>Redis: setJson("session:{sub}", {sid: newAccessSid}, 15min)
    AS->>JWT: sign({sub, email, sid: newAccessSid}, 15min) → new access_token

    AS-->>API: new access_token
    API->>API: res.cookie("access_token", ..., {httpOnly, secure, sameSite:lax, maxAge:15min})
    API-->>Client: 200 + Set-Cookie: access_token (new)
```

---

### 5. Logout

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AG as AuthGuard
    participant AS as AuthService
    participant Redis as Redis

    Client->>API: POST /v1/auth/logout<br/>Cookie: access_token=<jwt>
    API->>AG: canActivate → validate JWT + Redis session
    AG-->>API: req.user = { sub: userId }

    API->>AS: logout(userId)
    AS->>Redis: clear("session:{userId}")
    AS->>Redis: clear("refresh:{userId}")
    AS-->>API: done

    API->>API: res.clearCookie("access_token")
    API->>API: res.clearCookie("refresh_token")
    API-->>Client: 200 { success: true }
```

---

### 6. File Upload to S3

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AG as AuthGuard
    participant FI as FileInterceptor (Multer)
    participant VP as ParseFilePipe
    participant FC as FileController
    participant FS as FileService
    participant BS as BucketService
    participant S3 as AWS S3
    participant DB as PostgreSQL

    Client->>API: POST /v1/file/upload<br/>multipart/form-data {file, isPublic, postId?}<br/>Cookie: access_token=<jwt>
    API->>AG: Validate JWT + Redis session
    AG-->>API: req.user = { sub: userId }

    API->>FI: Parse multipart body → Express.Multer.File
    FI-->>API: file buffer in memory

    API->>VP: Validate file
    VP->>VP: FileTypeValidator: .(png|jpeg|jpg|svg)
    VP->>VP: MaxFileSizeValidator: ≤ 10MB

    alt Invalid file type or too large
        VP-->>API: throw BadRequestException
        API-->>Client: 400 Bad Request
    end

    API->>FC: uploadFile(file, userId, isPublic, postId?)
    FC->>FS: uploadFile(file, userId, isPublic, postId?)

    FS->>BS: uploadFile({ file, isPublic })
    BS->>BS: key = uuid()
    BS->>BS: url = `{S3_HOST}/{S3_BUCKET}/{key}`
    BS->>S3: PutObjectCommand({Bucket, Key: key, Body: buffer,<br/>ContentType: mimeType, ACL: public-read|private})
    S3-->>BS: Upload success
    BS-->>FS: { key, url }

    FS->>DB: prisma.file.create({<br/>  key, url, originalName, mimeType, size,<br/>  isPublic, uploaderId: userId, postId?<br/>})
    DB-->>FS: File record
    FS-->>FC: File entity
    FC-->>API: FileDto
    API-->>Client: 201 { id, key, url, originalName, mimeType, size, isPublic, uploaderId, postId }
```

---

### 7. Create Post

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant API as API Server
    participant AG as AuthGuard
    participant VP as ValidationPipe
    participant PC as PostController
    participant PS as PostService
    participant DB as PostgreSQL

    Client->>API: POST /v1/posts<br/>{title, content, published?}<br/>Cookie: access_token=<jwt>
    API->>AG: Validate JWT + Redis session
    AG-->>API: req.user = { sub: userId }

    API->>VP: Validate CreatePostRequestDto
    Note right of VP: title: 3-200 chars<br/>content: min 10 chars<br/>published: optional boolean
    VP-->>API: Valid DTO

    API->>PC: create(dto, userId)
    PC->>PS: create(dto, userId)
    PS->>DB: prisma.post.create({<br/>  title, content,<br/>  published: false (default),<br/>  authorId: userId<br/>})
    DB-->>PS: Post record
    PS-->>PC: Post entity
    PC-->>API: Post
    API-->>Client: 201 Post { id, title, content, published, authorId, createdAt }
```
