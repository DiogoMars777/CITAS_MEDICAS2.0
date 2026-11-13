# ==============================================================================
# Dockerfile Multietapa de Producción - Clínica Vida Salud (Laravel 11 / PHP 8.3)
# Optimizado para Railway y entornos cloud contenerizados
# ==============================================================================

FROM php:8.3-fpm-alpine

# Definir variables de entorno del sistema
ENV COMPOSER_ALLOW_SUPERUSER=1 \
    PORT=8000

# 1. Instalar dependencias nativas del sistema, Nginx, Supervisor y bibliotecas para PostgreSQL
RUN apk add --no-cache \
    nginx \
    supervisor \
    bash \
    curl \
    gettext \
    git \
    libpq-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    libzip-dev \
    icu-dev \
    oniguruma-dev

# 2. Configurar e instalar extensiones esenciales de PHP
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        bcmath \
        intl \
        opcache \
        pcntl

# 3. Traer la última versión de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Directorio de trabajo
WORKDIR /var/www/html

# 4. Copiar manifests de Composer primero (aprovecha la caché de capas de Docker)
COPY composer.json composer.lock ./

# Instalar dependencias sin ejecutar scripts de Laravel aún
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# 5. Copiar el código fuente completo del Backend
COPY . .

# 6. Generar el autoloader optimizado de Composer
RUN composer dump-autoload --optimize --no-dev --classmap-authoritative

# 7. Configuración de servicios (Nginx, Supervisor, PHP)
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini $PHP_INI_DIR/conf.d/custom.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

# Dar permisos de ejecución al entrypoint y preparar directorios
RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /etc/nginx/http.d /run/nginx /var/log/supervisor \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Exponer el puerto de Railway
EXPOSE 8000

# Punto de entrada
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

