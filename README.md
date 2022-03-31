# Rememberize
Rememberize is JS package that remember forms using built-in mechanism in every browser called cookies.
Has also built-in support for django forms (blacklisting mechanism for wizards).

Dependencies:
* jQuery (tested on 3.6.0 version)
* js-cookie (tested on 3.0.1)

Installation guide:
* Download `rememberize.js` from repository.
* Include it via `<script>` tag in website.
* Before the script tag include these two CDN scripts:
```
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/js-cookie@3.0.1/dist/js.cookie.min.js"></script>
```

TODO:
* Rewrite the package to be more performant using speedy VanillaJS.
* Not use jQuery and js-cookie anymore, to make it more lightweight.
* Compress cookie-data, since it's limited to 4096 characters (bytes).
