# MegaVibe MVP Overview

Live performance experiences are special.

Megavibe app is a tool to enhance them.

a. Frictionless Connection b. Insightful Interactivity c. Appreciation

## Beta Phase I: Fan Experience

Problem: Audio fingerprinting and machine learning enable music discovery with recorded audio. This doesn't work for live performances - no two are ever the same. Bookmarking a song/artist in the moment is hard + high friction.

Current (shoehorn) solution: "Follow me on z media at @sdf_dfs#2" or (rare) QR codes.
Megavibe solution: Click a button. See artist profile. Follow/bookmark the artist/song.
How: Using fan (geo)location + artist pre-registration to populate profiles.

Problem: Fans want to hear the songs they love at live shows, but artists may not always play them, due to difficulty gauging audience preferences (information assymetry) or a desire to maintain artistic integrity. Tools for real time personalization/customization inspiring engagement are lacking.

Current (shoehorn) solution: Verbal request in person, social media for more established artists (e.g. love song by an artist, going to their show hoping they play it)
Megavibe solution: Song bounties via supportive actions that can non-monetary (e.g. presaves, follows, sharing) and monetary e.g. tipping
How: Digital tracking of supportive actions & ratings/review system to engender trust on both sides (that artist will deliver on bounty + fan will deliver on support)

## Beta Phase II: Artist Experience

Problem: Performances can and should be the most powerful for inspiring in the moment decisions to connect with strangers. They are not currently. In part due to leaky bucket methods for converting/nurturing engaged enthusiast audiences (warm leads) into fans, supporters & followers.

Current (shoehorn) solution: "Follow me on z media at @sdf_dfs#2" or (rare) QR codes.
Megavibe solution: Fan clicks a button. See's artist profile. Follows/bookmarks the artist/song.  
How: Presubmits profile + performance location. Cached info served quickly & frictionlessly to users.

Problem: Honest feedback is essential for development. Metrics for recorded performances are detailed, granular & insight packed. For live performances such mechanisms are lacking. Leading to a reliance on gut instinct to gauge quality and progress (deadweight loss opportunity cost).

Current (shoehorn) solution: volume of clapping/cheers, conversation, social media (weak)
Megavibe solution: Real time gamified tracking/metrics of conversion in live performance settings.  
How: Emoji based responsive interactivity, leaderboard dynamic & social sharing incentivisation.

Phase III: Host Experience

Problem: The live experience is under monetized. Streaming platforms have demonstrated the viability of micropayments, sponsorships, subscriptions and merchandise as levers. Tooling to include & incentivise merchant partners in artist journey's as key stakeholders is lacking.

Current solution: ticketing + F&B (split between promoter & venue)
Megavibe solution: Real time gamified tracking/metrics of conversion in live performance settings.  
How: Emoji based responsive interactivity, leaderboard dynamic & social sharing incentivisation.

Problem: Early-stage live experiences, such as open mics, are under-personalized i.e. random varieties of quality, experience, & genre levels. Hosts lack tools to manage flow e.g. matching artists to songs, connecting artists who can play the same song, and balancing the number of covers vs. originals.

Current solution: host or featured artists booked (some guarantee of quality for audience)
Megavibe solution: genre & experience level matching / tracking + integrity ratings & review system (artist performs what they say they will, at the experience/quality level indicated).

## Current Features Focus

(a) Frictionless Connection: Fans can easily follow and bookmark artists and songs with a single click, using their location to tap into pre-populated artist profiles.

(b) Insightful Interactivity: Fans can use Megavibe's emoji scores to rate artists' performances, this enables them to see how others vote, what others are thinking, and receive artist incentives.

(c) Appreciation: Fans can participate in song bounties and tipping via supportive actions to encourage artists to play their favorite songs.

## Features Roadmap

Artist profiles
Host & Artist dashboard (analytics)
Genre and experience level matching / tracking
Integrity score ratings and reviews
User profules (frictionless follows in app)
Supportive actions tracking
Tipping/payments via Paypal + Web3
Emoji scores & leaderboard
Emoji based playlists

## Development Roadmap

Short Term

Landing page (above & below)
Simple Tracking Board For How Others Rated A Song
Web3 & Web2 Social Sign In via 3rd parties
Improve signups/waitlist logic (position in queue, actions to go higher etc)
Notification When Bounty Is Set/Accepted

Medium Term

Geolocation & Mechanism
Email Notification When A Tip or Bounty Is Set/Accepted
Tipping Balance Isn’t Deposited for 24hrs (pre-authorization) incase of issue
Go from five clicks to find artist, to three clicks
Scrollable Songs (don’t need to be hyperlinks / hard coded)
Simple analytics based on Emojis/Ratings
Alternative to gleam / inhouse version

Long Term

Proper Stripe or Paypal Integration, Web3 Integration
Improve explainers around site
Host Functionality & Monetisation
Go from three clicks to find artist, to one
User & Session Auth in house
Arbitration
ML algorithms forecasting e.g.how artists/campaigns will do in x location
AI integration for analytics

## Dependencies

- Node.js
- Express.js
- MongoDB (with MongoDB Atlas)
- React
- Axios (for API requests)
