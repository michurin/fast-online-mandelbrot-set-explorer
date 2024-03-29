# Fast online Mandelbrot set explorer [![test](https://github.com/michurin/fast-online-mandelbrot-set-explorer/actions/workflows/ci.yml/badge.svg)](https://github.com/michurin/fast-online-mandelbrot-set-explorer/actions/workflows/ci.yml)

[https://michurin.github.io/fast-online-mandelbrot-set-explorer/](https://michurin.github.io/fast-online-mandelbrot-set-explorer/)

## Status

Just for fun project. It's not totally finished.

## Limitations

This solution is based on WebGL. So, it doesn't work in old browsers and hardware.

## Motivation

There are a lot of Mandelbrot exploring projects, that are focused on
palette selection and beautiful result.
The goal of the project, in contrast, is to create online
fast Mandelbrot and Julia sets viewer that will provide
*full information* about image.

It helps you to find beautiful place and then you could use
offline tools to create high resolution and custom colored image.

## Tips and tricks

If you wish to render high resolution you are free to tweak
canvas size using your browser's developer tools.

Say something like this on browser debug console:

```javascript
a = b = 1000; // use a!=b on retina
$($('canvas').get(1)).attr({width: a, height: a, style: `width: ${b}px; height: ${b}px;`});
```

## Resources

- [Explanation of the Mandelbrot Set (video)](https://youtu.be/9gk_8mQuerg)
- [Best Mandelbrot](https://www.math.univ-toulouse.fr/~cheritat/wiki-draw/index.php/Mandelbrot_set)
- [Amazing fractals navigator with ability to view WebGL code](https://hirnsohle.de/test/fractalLab/) (UI is not very friendly, however you won't be disappointed if you spend ten minutes to learn it)
- [Ideas for UI](https://www.shadertoy.com/view/3dfBDN)
- [UI (paletter editor)](http://math.hws.edu/eck/js/mandelbrot/MB.html)
- [Optimisation hints](https://www.math.univ-toulouse.fr/~cheritat/wiki-draw/index.php/Mandelbrot_set)
- [Clear and straightforward code (pure C)](https://github.com/josch/mandelbrot)
