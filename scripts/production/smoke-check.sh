#!/usr/bin/env bash
set -eu

dry_run=0
backend_url="${NEXT_PUBLIC_SERVER_URL:-https://admin.open-agency.io}"
api_url="${API_BASE_URL:-$backend_url}"
marketing_url="${MARKETING_APP_BASE_URL:-https://open-agency.io}"
courses_url="${COURSES_APP_BASE_URL:-https://courses.open-agency.io}"
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

check_url "backend-admin" "${backend_url%/}/admin"
check_url "backend-api" "${api_url%/}/api/globals/header?depth=0"

if [ "$check_frontends" -eq 1 ]; then
  check_url "marketing-home" "${marketing_url%/}/"
  check_url "courses-home" "${courses_url%/}/"
fi
