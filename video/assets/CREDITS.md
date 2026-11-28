# Credits

Everything here is free to use under its licence. Credit is given anyway.

## People (Pexels License)

The avatars are stand-ins. Sonora itself draws DiceBear `slice` art from each user's seed. People who appear on camera take their avatar from a frame of their own clip.

| In the film | File | Source | Author |
|---|---|---|---|
| omar | `stock/feeds/omar.mp4`, `stock/avatars/omar.jpg` | https://www.pexels.com/video/7261921/ | MART PRODUCTION |
| ravi | `stock/feeds/ravi.mp4`, `stock/avatars/ravi.jpg` | https://www.pexels.com/video/7790378/ | Kampus Production |
| osama (You) | `stock/feeds/osama.mp4`, `stock/avatars/osama.jpg` | https://www.pexels.com/video/6787150/ | Artem Podrez |
| theo | `stock/feeds/theo.mp4`, `stock/avatars/theo.jpg` | https://www.pexels.com/video/5941016/ | Theo Decker |
| sami | `stock/feeds/sami.mp4`, `stock/avatars/sami.jpg` | https://www.pexels.com/video/8135478/ | ANTONI SHKRABA production |
| marco | `stock/feeds/marco.mp4`, `stock/avatars/marco.jpg` | https://www.pexels.com/video/6324541/ | Vanessa Garcia |
| kenji | `stock/feeds/kenji.mp4`, `stock/avatars/kenji.jpg` | https://www.pexels.com/video/7643311/ | MART PRODUCTION |
| dad | `stock/avatars/dad.jpg` | https://www.pexels.com/video/6306212/ | Kampus Production |
| karim | `stock/avatars/karim.jpg` | https://www.pexels.com/video/6194923/ | Diva Plavalaguna |
| jonas | `stock/avatars/jonas.jpg` | https://www.pexels.com/video/4872862/ | Tima Miroshnichenko |
| dev | `stock/avatars/dev.jpg` | https://www.pexels.com/video/8965302/ | Mikael Blomkvist |
| yusuf | `stock/avatars/yusuf.jpg` | https://www.pexels.com/video/7792540/ | Yan Krukau |

Every call clip is filmed by the person's own device (webcam or phone front camera), looking into the lens. Clips are trimmed to 8–12 s, cropped 4:3 around the face, and levelled to a shared brightness with a slight desaturation, so the grid reads as one call.

## Images (Pexels License)

| File | Source | Author |
|---|---|---|
| `stock/flat.jpg` (the Lisbon living room) | https://www.pexels.com/photo/19966784/ | Alex Tyson |

## Music

| Track | Artist | Source | Licence |
|---|---|---|---|
| Night Owl | Broke For Free | https://freemusicarchive.org/music/Broke_For_Free/Directionless_EP/Broke_For_Free_-_Directionless_EP_-_01_Night_Owl/ | CC BY 3.0 |

## Sound effects

| Use | File | Source | Author / licence |
|---|---|---|---|
| UI cues (send, receive, react, ring, connect, join) | `sfx/notes/*.wav`, sliced from `sfx/src/yarn.C4B4–C6B6.aif` | Marimba, yarn mallets, mf: https://theremin.music.uiowa.edu/MISmarimba.html | University of Iowa Electronic Music Studios, free to use without restriction |
| Seam whooshes | `sfx/src/air-whoosh-5-592509.mp3`, `air-whoosh-8-592506.mp3` | https://pixabay.com/sound-effects/film-special-effects-soft-luxury-air-whoosh-5-592509/ (and -8-592506) | sdanezis, Pixabay Content License |
| Seam whoosh | `sfx/src/thin-swoosh-352756.mp3` | https://pixabay.com/sound-effects/film-special-effects-thin-swoosh-352756/ | Universfield, Pixabay Content License |

The cues play Sonora's own sound kit (`apps/web/src/lib/sound.ts`) on a real marimba instead of its oscillators: the same notes, in D major pentatonic, retuned 11 cents to sit with the track. `video/mix.py` lays them on the beat grid and masters the result to −16 LUFS.
