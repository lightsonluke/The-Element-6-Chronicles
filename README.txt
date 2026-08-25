MINI CURSOR + FINAL MUSIC PATCH

Upload these files to the ROOT of your GitHub repository:

  index.css                 Replace existing file
  music.js                  Replace existing file
  public/audio/final.mp3    Replace/add this file

The ZIP keeps the public/audio folder path for final.mp3. If GitHub's uploader
does not preserve it, open public -> audio in GitHub first, then upload final.mp3
into that folder.

No Supabase SQL is needed for this patch.

The CSS removes the text cursor from regular game UI. It remains a text cursor
only inside text inputs, textareas, and editable text fields.

music.js explicitly puts Final in the fight/sports battle rotation and keeps it
as the Grand Circuit championship track.
