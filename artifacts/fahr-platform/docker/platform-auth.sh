#!/bin/sh
#
# Rebuild the HTTP Basic guard from the environment on every container start.
#
# This is the static-hosting half of lib/basic-auth: same two variables, same
# realm, same fail-closed contract. When either credential is missing the
# platform serves nothing but its health check — see the `503` note in
# .env.example and lib/basic-auth/src/index.mjs.
#
# Run by the stock nginx entrypoint (/docker-entrypoint.d) before nginx starts.

set -eu

AUTH_CONF=/etc/nginx/platform-auth.conf
HTPASSWD=/etc/nginx/.htpasswd
REALM="FAHR AI Learning Platform"

if [ -z "${PLATFORM_AUTH_USERNAME:-}" ] || [ -z "${PLATFORM_AUTH_PASSWORD:-}" ]; then
    echo "platform-auth: refusing all requests: PLATFORM_AUTH_USERNAME and PLATFORM_AUTH_PASSWORD must both be set." >&2
    printf 'return 503;\n' > "$AUTH_CONF"
    rm -f "$HTPASSWD"
    exit 0
fi

# bcrypt (-B) rather than the default: the file lives in a layer-less tmpfs-ish
# path but the password is a real shared credential.
htpasswd -bcB "$HTPASSWD" "$PLATFORM_AUTH_USERNAME" "$PLATFORM_AUTH_PASSWORD" >/dev/null

# Readable by the worker processes, by nobody else.
chown root:nginx "$HTPASSWD" 2>/dev/null || true
chmod 640 "$HTPASSWD"

cat > "$AUTH_CONF" <<CONF
auth_basic "$REALM";
auth_basic_user_file $HTPASSWD;
CONF

echo "platform-auth: Basic auth enabled for user '$PLATFORM_AUTH_USERNAME'."
