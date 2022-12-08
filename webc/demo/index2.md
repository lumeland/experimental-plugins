---
title: CDNs can run code now
templateEngine: md,webc
layout: layout.njk
---

One area where htmx apps lag behind SPAs is interaction delay. While htmx apps
usually have a much improved initial load time, the need for a server roundtrip
for most interactions is a disadvantage.

For most apps, this doesn't matter, as they are all frontends to databases
anyway. Thus, there is always a request to the server; the difference is whether
the response is HTML or a proprietary JSON-based format that needs to be
converted to HTML.

The latency issue is even less of a problem thanks to... let's call it
Application on CDN (AoCDN). The common term for this technology is
<no-spoiler>"edge compute"</no-spoiler>, which I refuse to say.

AoCDN is a service offered by some hosting and CDN providers. It that your code
runs on <no-spoiler>several</no-spoiler> servers all across the world, close to
the user.
