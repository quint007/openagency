#!/usr/bin/env bash
set -eu

dry_run=0
backend_url="${NEXT_PUBLIC_SERVER_URL:-https://admin.open-agency.io}"
api_url="${API_BASE_URL:-$backend_url}"
marketing_url="${MARKETING_APP_BASE_URL:-https://open-agency.io}"
marketing_deploy_url=""
courses_url="${COURSES_APP_BASE_URL:-https://courses.open-agency.io}"
check_frontends=1
check_courses=1

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
    --marketing-deploy-url)
      marketing_deploy_url="$2"
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
    --skip-courses)
      check_courses=0
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

curl_args="-sS -L --connect-timeout 10 --max-time 30 -o /dev/null -w %{http_code}"
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

check_not_found() {
  name="$1"
  url="$2"

  if [ "$dry_run" -eq 1 ]; then
    echo "[dry-run] expect 404: curl $curl_args $url"
    return 0
  fi

  status_code="$(curl $curl_args "$url")"
  if [ "$status_code" = "404" ]; then
    echo "PASS $name $status_code $url"
    return 0
  fi

  echo "FAIL $name expected 404, got $status_code $url" >&2
  exit 1
}

check_url "backend-admin" "${backend_url%/}/admin"
check_url "backend-api" "${api_url%/}/api/globals/header?depth=0"

if [ "$check_frontends" -eq 1 ]; then
  check_url "marketing-home" "${marketing_url%/}/"
  check_not_found "marketing-thumbnail-preview-removed" "${marketing_url%/}/blog/thumbnail-preview"

  if [ -n "$marketing_deploy_url" ]; then
    check_url "marketing-deployment" "${marketing_deploy_url%/}/"
  fi
fi

if [ "$check_frontends" -eq 1 ] && [ "$check_courses" -eq 1 ]; then
  check_url "courses-home" "${courses_url%/}/"
fi
