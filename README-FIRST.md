# Complete Supabase account and cloud-save update

Use this pack instead of every previous Supabase ZIP.

1. Upload and replace every file in this folder to the matching place in your
   GitHub repository. Keep `.github/workflows/deploy.yml` in that exact nested
   folder path.
2. In Supabase SQL Editor, run `Supabase-cloud-save-setup.sql` once.
3. Wait for the GitHub Actions deployment to finish.
4. Open the game, then Settings -> Account & Cloud Saves, and create an account.

The included `package.json` and workflow install the Supabase JavaScript package
before building. This prevents the missing-package build error.
