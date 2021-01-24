#!/usr/bin/env python3

import numpy as np
import matplotlib.pyplot as plt

def flat(x1, x2, y1, y2, steps_per_unit, tp=None):
    if tp is None:
        tp = np.clongdouble
    w = int((x2-x1)*steps_per_unit + 1)
    h = int((y2-y1)*steps_per_unit + 1)
    a = np.linspace(x1, x2, w, dtype=tp)[np.newaxis, ...]
    b = np.linspace(y2, y1, h, dtype=tp)[..., np.newaxis] * 1j
    return a + b

def main():
    boilout = 100.
    f = flat(-3, 3, -3, 3, 100)
    assert str(f.dtype) == 'complex256'
    z = np.zeros(f.shape).astype(f.dtype)
    assert str(z.dtype) == 'complex256'
    n = np.zeros(f.shape).astype(np.int)
    for i in range(150):
        print('Iter', i)
        a = np.abs(z)
        m = a <= boilout
        z[m] = z[m] * z[m] + f[m]
        n[m] += 1

    # r = |z| (final)
    # n = iterations
    # V = ln(r)/(2**n)
    # -ln(V)/ln(2) = n - lnln(r)/ln(2)
    v = np.zeros(f.shape).astype(np.float)  # plt.show() can not manage np.double
    m = np.logical_not(m)
    v[m] = n[m] - np.log(np.log(np.abs(z[m])))/np.log(2)
    plt.imshow(v, vmin=0, vmax=100)

    plt.colorbar().set_label('label')
    plt.show()

if __name__ == '__main__':
    main()
