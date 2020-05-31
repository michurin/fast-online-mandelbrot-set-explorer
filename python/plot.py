#!/usr/bin/env python3

import click

#from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.colors as clrs


# math


def flat(x1, x2, y1, y2, steps_per_unit):
    a = np.linspace(x1, x2, int((x2-x1)*steps_per_unit + 1))[np.newaxis, ...]
    b = np.linspace(y2, y1, int((y2-y1)*steps_per_unit + 1))[..., np.newaxis] * 1j
    return a + b


def M(x1, x2, y1, y2, dpu, r, iters):
    c = flat(x1, x2, y1, y2, dpu)
    sp = c.shape
    z = np.zeros(sp).astype(np.complex)
    t = np.ones(sp).astype(np.bool)  # "target" flag
    s = np.zeros(sp).astype(np.int)  # "steps" if you wish
    v = np.zeros(sp)  # log(potential)
    for i in range(iters):
        z[t] = z[t] * z[t] + c[t]
        a = abs(z)
        new = np.logical_and(t, a > r)
        s[new] = i
        v[new] = np.log(np.log(a[new])) - i * np.log(2.)  # log(potential) = np.log(np.log(a[new])/np.power(2., i))
        t[new] = False
    return t, s, v


def J(x1, x2, y1, y2, dpu, r, iters, c):
    z = flat(x1, x2, y1, y2, dpu)
    sp = z.shape
    t = np.ones(sp).astype(np.bool)  # "target" flag
    s = np.zeros(sp).astype(np.int)  # "steps" if you wish
    v = np.zeros(sp)  # log(potential)
    for i in range(iters):
        z[t] = z[t] * z[t] + c
        a = abs(z)
        new = np.logical_and(t, a > r)
        s[new] = i
        v[new] = np.log(np.log(a[new])) - i * np.log(2.)  # log(potential) = np.log(np.log(a[new])/np.power(2., i))
        t[new] = False
    return t, s, v


# playground/examples


@click.group()
def cli():
    pass


@cli.command()
def met():
    '''Show full Mandelbrot set; escape time based (simples)'''
    borders = -2.2, .8, -1.5, 1.5  # full view
    s, c, v = M(*borders, 200, 2, 1000)
    plt.imshow(c+1, extent=borders, norm=clrs.LogNorm())
    plt.colorbar().set_label('Escape time + 1 (to avoid zeroes)')
    plt.title('Mandelbrot set. Escape time based (r=2)')
    plt.show()


@cli.command()
def mpart():
    '''Show part of Mandelbrot set; sin(log(potential)) coloring'''
    borders = -1.2305, -1.2240, .1613, .1690
    s, c, v = M(*borders, 100000, 10000, 3000)
    v[np.logical_not(s)] = np.sin(v[np.logical_not(s)]*.05)
    v[s] = np.average(v[np.logical_not(s)])
    plt.imshow(v, extent=borders)
    plt.colorbar().set_label('sin(log(potential))')
    plt.title('Mandelbrot set')
    plt.show()


@cli.command()
def jet():
    '''Show full Julia set; escape time based (simples)'''
    borders = -2, 2, -1.5, 1.5  # full view
    s, c, v = J(*borders, 200, 2, 1000, -0.205 + 0.647j)
    plt.imshow(c+1, extent=borders, norm=clrs.LogNorm())
    plt.colorbar().set_label('Escape time + 1 (to avoid zeroes)')
    plt.title('Julia set. Escape time based (r=2)')
    plt.show()


@cli.command()
def jpart():
    '''Show part of Julia set; sin(log(potential)) coloring'''
    borders = .076, .646, .034, .407
    s, c, v = J(*borders, 1000, 2, 3000, -0.205 + 0.647j)
    v[np.logical_not(s)] = np.sin(v[np.logical_not(s)]*.15)
    v[s] = np.average(v[np.logical_not(s)])
    plt.imshow(v, extent=borders)
    plt.colorbar().set_label('sin(log(potential))')
    plt.title('Julia set')
    plt.show()


if __name__ == '__main__':
    cli()
