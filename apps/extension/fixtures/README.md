# Testsider

Statiske skjemaer for manuell testing av extensionen. Ingenting sendes inn.

```bash
npx serve apps/extension/fixtures   # eller: python3 -m http.server -d apps/extension/fixtures 8080
```

Åpne siden, klikk på extensionen og velg «Fyll ut denne siden».

- `norsk-skjema.html`: norske labels, select, datofelt, skjulte filfelt og «gjenta e-post»
- `engelsk-react.html`: React-kontrollerte felt. JSON-en nederst viser om React fikk med seg endringene.
