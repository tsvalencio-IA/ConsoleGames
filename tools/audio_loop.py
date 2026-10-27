"""Continuous engine loops; start/stop envelopes belong to playback."""
import numpy as np

def smooth_loop(samples, sample_rate=24000, seconds=.10):
    samples = np.asarray(samples, dtype=np.float32)
    count = min(round(sample_rate * seconds), len(samples) // 5)
    if count < 2:
        raise ValueError('Engine recording is too short')
    result = samples[count:].copy()
    mix = .5 - .5 * np.cos(np.linspace(0, np.pi, count))
    result[-count:] = samples[-count:] * (1 - mix) + samples[:count] * mix
    return result
