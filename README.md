Fast online Mandelbrot set explorer
===================================

[https://michurin.github.io/fast-online-mandelbrot-set-explorer/](https://michurin.github.io/fast-online-mandelbrot-set-explorer/)

Status
------

Just for fun project. It's not totally finished.

Motivation
----------

There are a lot of Mandelbrot exploring project, that are focused on palete selection and butiful result.
The goal of the project, in contrast, is to create online fast Mandelbrot viewer that will provide *full information* about image.
It helps you to find beautiful place and then you could use offline tools to create high resolution and custom colored image.

TODO
----

- Custom zoom (UI)
- Fast zoom (just scale existing image first)
- Show details (UI)
- Settings (UI and minor refactoring: split arena initialization)
- Julia set (refactoring of workers pool and UI)

No plans to
-----------

- Support of all browsers. I don't use tricky and magical things.
  However, if you browser doesn't support web workers and canvas, I'm sorry.
  I'm not going to develop some fallbacks to support all browsers.
- Develop powerfull palleter editor.
- Provide an ability to prepare high quolity/resolution images for downloading.

Resources
---------

- [Ideas for UI](https://www.shadertoy.com/view/3dfBDN)
- [UI (paletter editor)](http://math.hws.edu/eck/js/mandelbrot/MB.html)
- [Optimisation hints](https://www.math.univ-toulouse.fr/~cheritat/wiki-draw/index.php/Mandelbrot_set)
