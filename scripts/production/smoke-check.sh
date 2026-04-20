#!/usr/bin/env bash
set -eu

dry_run=0
backend_url="${NEXT_PUBLIC_SERVER_URL:-https://admin.open-agency.io}"
api_url="${API_BASE_URL:-$backend_url}"
marketing_url="${MARKETING_APP_BASE_URL:-https://open-agency.io}"
courses_url="${COURSES_APP_BASE_URL:-https://courses.open-agency.io}"
marketing_revalidate_url="${MARKETING_REVALIDATE_URL:-}"
courses_revalidate_url="${COURSES_REVALIDATE_URL:-}"
check_frontends=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --backend-url)
      backend_url="$2"
      shift 2
      ;;
    --api-url)
      api_url="$2"
      shift 2
      ;;
    --marketing-url)
      marketing_url="$2"
      shift 2
      ;;
    --courses-url)
      courses_url="$2"
      shift 2
      ;;
    --backend-only)
      check_frontends=0
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

curl_args="-sS -L -o /dev/null -w %{http_code}"
if [ -n "${ALPHA_BASIC_AUTH_USERNAME:-}" ] && [ -n "${ALPHA_BASIC_AUTH_PASSWORD:-}" ]; then
  curl_args="$curl_args -u ${ALPHA_BASIC_AUTH_USERNAME}:${ALPHA_BASIC_AUTH_PASSWORD}"
fi

check_url() {
  name="$1"
  url="$2"

  if [ "$dry_run" -eq 1 ]; then
    echo "[dry-run] curl $curl_args $url"
    return 0
  fi

  status_code="$(curl $curl_args "$url")"
  case "$status_code" in
    2*|3*)
      echo "PASS $name $status_code $url"
      ;;
    *)
      echo "FAIL $name $status_code $url" >&2
      exit 1
      ;;
  esac
}

check_backend_dns_mode() {
  url="$1"

  if [ "$dry_run" -eq 1 ]; then
    echo "[dry-run] validate backend origin headers for ${url%/}/admin"
    return 0
  fi

  headers_file="$(mktemp)"
  trap 'rm -f "$headers_file"' EXIT

  if [ -n "${ALPHA_BASIC_AUTH_USERNAME:-}" ] && [ -n "${ALPHA_BASIC_AUTH_PASSWORD:-}" ]; then
    curl -sS -I -u "${ALPHA_BASIC_AUTH_USERNAME}:${ALPHA_BASIC_AUTH_PASSWORD}" "${url%/}/admin" >"$headers_file"
  else
    curl -sS -I "${url%/}/admin" >"$headers_file"
  fi

  if grep -Eiq '^server:\s*cloudflare\s*$' "$headers_file"; then
    echo "FAIL backend-origin-proxy admin backend is responding through Cloudflare. Production expects admin.open-agency.io to stay DNS-only so Railway terminates TLS directly; proxied mode can surface 525 publish failures." >&2
    exit 1
  fi

  rm -f "$headers_file"
  trap - EXIT
  echo "PASS backend-origin-proxy direct backend origin detected for ${url%/}/admin"
}

check_revalidate_origin() {
  name="$1"
  base_url="$2"

  if [ -z "$base_url" ]; then
    return 0
  fi

  target="${base_url%/}/api/revalidate"

  if [ "$dry_run" -eq 1 ]; then
    echo "[dry-run] curl -sS -I -o /dev/null -w %{http_code} $target"
    return 0
  fi

  status_code="$(curl -sS -I -o /dev/null -w %{http_code} "$target")"
  case "$status_code" in
    2*|3*|4*)
      echo "PASS $name $status_code $target"
      ;;
    *)
      echo "FAIL $name $status_code $target" >&2
      exit 1
      ;;
  esac
}

check_url "backend-admin" "${backend_url%/}/admin"
check_url "backend-api" "${api_url%/}/api/globals/header?depth=0"
check_backend_dns_mode "$backend_url"

if [ "$check_frontends" -eq 1 ]; then
  check_url "marketing-home" "${marketing_url%/}/"
  check_url "courses-home" "${courses_url%/}/"
fi

check_revalidate_origin "marketing-revalidate-origin" "$marketing_revalidate_url"
check_revalidate_origin "courses-revalidate-origin" "$courses_revalidate_url"
