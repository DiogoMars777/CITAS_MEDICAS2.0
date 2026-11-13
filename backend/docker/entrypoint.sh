#!/bin/sh
set -e

# Asignar puerto por defecto si Railway o el entorno no lo definieron
export PORT="${PORT:-8000}"
echo "🚀 Iniciando contenedor Clínica Vida Salud en el puerto: ${PORT}"

# Sustituir variables en la plantilla de Nginx
envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

# Asegurar directorios requeridos por Laravel y permisos de www-data
mkdir -p \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Crear enlace simbólico de almacenamiento público si no existe
if [ ! -L /var/www/html/public/storage ]; then
    echo "🔗 Creando storage:link..."
    php artisan storage:link || true
fi

# Ejecutar optimizaciones en producción sólo si APP_KEY está configurada
if [ -n "$APP_KEY" ]; then
    echo "⚡ Optimizando caches de Laravel..."
    php artisan config:cache || true
    php artisan route:cache || true
    php artisan view:cache || true
fi

# Ejecutar migraciones automáticas si RUN_MIGRATIONS=true o si estamos en Railway con DB conectada
if [ "$RUN_MIGRATIONS" = "true" ] || [ -n "$DB_HOST" ]; then
    echo "📦 Ejecutando migraciones de base de datos..."
    php artisan migrate --force || echo "⚠️ Advertencia: No se pudieron ejecutar migraciones automáticas al iniciar."
fi

echo "🟢 Servidor listo. Arrancando Supervisord (Nginx + PHP-FPM)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf

