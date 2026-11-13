#!/bin/sh

# Determinar puertos de escucha únicos para Nginx (cubre 8000, 80 y cualquier puerto dinámico de Railway)
PORTS="8000 80"
if [ -n "$PORT" ] && [ "$PORT" != "8000" ] && [ "$PORT" != "80" ]; then
    PORTS="$PORTS $PORT"
fi

LISTEN_DIRECTIVES=""
for p in $PORTS; do
    LISTEN_DIRECTIVES="${LISTEN_DIRECTIVES}listen $p; listen [::]:$p; "
done
export LISTEN_DIRECTIVES

echo "🚀 Iniciando contenedor Clínica Vida Salud escuchando en puertos: ${PORTS}"

# Sustituir directivas de escucha en la plantilla de Nginx
envsubst '${LISTEN_DIRECTIVES}' < /etc/nginx/templates/default.conf.template > /etc/nginx/http.d/default.conf

# Crear carpetas temporales de Nginx y permisos
mkdir -p /run/nginx /var/log/supervisor /var/lib/nginx/tmp /run
chown -R nginx:nginx /var/lib/nginx /run/nginx 2>/dev/null || true

# Asegurar directorios requeridos por Laravel y permisos de www-data
mkdir -p \
    /var/www/html/storage/framework/cache/data \
    /var/www/html/storage/framework/sessions \
    /var/www/html/storage/framework/views \
    /var/www/html/storage/logs \
    /var/www/html/bootstrap/cache

chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# Enlace de almacenamiento público
php artisan storage:link 2>/dev/null || true

# Limpiar caches previas para asegurar que lea las variables de Railway en vivo
php artisan config:clear || true
php artisan route:clear || true

# Test de configuración Nginx y PHP-FPM para depuración en logs de Railway
nginx -t || echo "⚠️ Advertencia Nginx test"
/usr/local/sbin/php-fpm -t || echo "⚠️ Advertencia PHP-FPM test"

echo "🟢 Servidor listo. Arrancando Supervisord (Nginx + PHP-FPM)..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
