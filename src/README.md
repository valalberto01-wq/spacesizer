# SpaceSizer calculation engine

This folder contains the reusable storage and vehicle recommendation logic for
the future SpaceSizer website and mobile apps.

Key rules:

- Full storage units default to a configurable 2.2 m height.
- Lockers are matched using their actual internal width, depth and height.
- Locker suitability is limited to box, bag and suitcase-type loads.
- Vehicle bands preserve SpaceSizer's current operational guidance.
- Provider-specific locker dimensions can be supplied when known.

Run the checks with:

```bash
npm test
```

This first phase is deliberately separate from the live calculator. It can be
reviewed and tested before the website is switched to the shared engine.
