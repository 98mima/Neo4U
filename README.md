# namgram 
![namgram-logo](https://cdn.discordapp.com/attachments/777890574253817889/792441180054749224/e52d18ae-4e0c-40cf-8d30-07396304f4e0_200x200.png)
* Nikola Zlatkov 16593
* Aleksa Antic 16472
* Mila Savic 16852
* Miljana Randjelovic 16842

## Uvod
  Aplikacija namgram predstavlja Instagram klon.
  Naime to je socijalna mreza gde korisnici mogu
  medjusobno da interaguju, postavljaju slike, 
  komentarisu, lajkuju, dislajkuju i komuniciraju.
  
## Struktura
  * Frontend aplikacija se nalazi u folderu namgram.
      Tehnologija za frontend je typescript React zajedno sa reduxom.
  * Backend aplikacija se nalazi u folderu namgram-API.
      Tehnologija za backend je Node.js pisan u javascriptu.
  * Za baze koristimo Neo4j i Redis.
      
## Pokretanje:
  1. Add database u neo4j gui. I podesi se username i password za administratora.
  2. U namgram-API/config/credentials.js nalaze se credentials za logovanje u bazi. Tu treba da se stave podaci napravljeni u prethodnom koraku.
  3. Pokretanje redis-server.exe kao administrator.
  4. U folderu namgram-API treba da se pokrene bash komanda *npm install*, pa onda *npm start*.
  5. U folderu namgram treba da se pokrene bash komanda *npm install*, pa onda *npm start*.
  6. Nakon toga ce se automatski otvoriti aplikacija u default browseru na portu *3000*
