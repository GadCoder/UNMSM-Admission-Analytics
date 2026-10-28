from django.utils.cache import patch_cache_control


PUBLIC_API_URL_NAMES = frozenset(
    {
        "api-root",
        "academic-areas",
        "faculties",
        "majors",
        "modalities",
        "processes",
        "process-detail",
        "latest-overview",
        "comparative-overview",
        "process-history",
        "major-detail",
    }
)
PUBLIC_API_BROWSER_MAX_AGE = 30
PUBLIC_API_SHARED_MAX_AGE = 60


class PublicApiCacheHeadersMiddleware:
    """Set short-lived HTTP caching headers on successful public API reads."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        if (
            request.method == "GET"
            and request.resolver_match
            and request.resolver_match.url_name in PUBLIC_API_URL_NAMES
            and response.status_code == 200
            and not response.cookies
            and "Cache-Control" not in response
        ):
            patch_cache_control(
                response,
                public=True,
                max_age=PUBLIC_API_BROWSER_MAX_AGE,
                s_maxage=PUBLIC_API_SHARED_MAX_AGE,
            )

        return response
