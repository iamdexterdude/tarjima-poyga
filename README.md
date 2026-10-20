# Tarjima Poyga

An Uzbek → English translation race for beginners (Navigate Beginner A1, Units 1–4 and lesson 5.1).
Every sentence is present simple: positive, negative or question.

Live: https://iamdexterdude.github.io/tarjima-poyga/

- **Board**: teacher-led, ten sentences per level on the big screen.
- **Arena**: each student races through ten sentences (4 easy, 3 average, 3 hard) with a timer, heartbeat music and instant right/wrong feedback. Answers can be typed or spoken (mic button; Chrome, Edge or Safari).
- **History**: every finished race is saved in the browser with every answer, and can be downloaded as a CSV for Excel. An unfinished race is saved after each answer and can be continued.

## How answers are checked
- a / an / the never make an answer wrong.
- Synonyms are accepted: store = shop, mum/mom = mother, movie = film, bike = bicycle, sneakers = trainers, and so on.
- Grammar must be right (he works, she doesn't work, does he work?).
- Spelling must be right; a spelling slip is shown with the correction and does not score. The teacher can still accept any answer on the results screen.

## Adding sentences
Edit `js/bank.js`. Each row is `[Uzbek, English pattern, tip]`:
`(a|b)` means either word, `[a]` means optional. The first option is the model answer.

## Unit 1–2 Test Race (`unit12/`)
A timed test for New Round-Up 1, Unit 1 (a / an) and Unit 2 (plurals). 342 questions in six types
(choose, fill the gap, word order, translate, fix the mistake, sort a / an), with picture questions,
core questions first and a double-point challenge round at the end. Same race look, music, voice, saved
history and CSV export as the translation race. Questions live in `unit12/js/test-bank.js`.
