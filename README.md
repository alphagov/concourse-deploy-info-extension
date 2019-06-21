# Concourse deploy info extension

A (WIP) Chrome extension intended to indicate differences between deploy jobs.

## Installation

Currently in development, this extension can be installed unpacked:

1. Clone this repo locally
2. In your chrome browser click on the 3 dots (top right).
3. Click on 'More tools'
4. Click on 'Extensions'
5. Switch on 'Developer mode' (top right).
6. Click 'Load unpacked' (top left).
7. Select the repo directory

## Configuration

You'll need a Github OAuth token as Github rate-limits their API.

1. Click on 'Details' from the Chrome Extensions page.
2. Scroll down to 'Options'
3. Add Github OAuth Token, Github team name (alphagov), Concourse base URL and Concourse team name.
4. Click 'Save'

## Use it

1. Browse to Concourse and authenticate.
2. Click the extension icon and click on the appropriate project.
3. Commits (if any) between the two deployment jobs (typically staging and production) should appear.


