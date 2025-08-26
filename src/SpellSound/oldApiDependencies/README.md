# Folder description
This folder is for a module containing old (and removed) item-related APIs from "@highlite/plugin-api".

# Why the APIs are no longer in Highlite
The code was refactored to let "Reflector" do more of the heavy-lifting in terms of automatically defining interfaces.

However, before the new definitions for "reflector" were added, the dev leading the migration stepped down. I am not sure precisely how to properly map this into reflector at this time. I can probably figure it out given enough research.

***This is still how HighSpell works, but Highlite no longer
exposes an easy way to access it.***


# Why is this plugin adding back the APIs?
These were removed in a more recent version of Highlite, but the SpellSound plugin
depends on them.


The SpellSound plugin relies heavily on checking the inventory to trigger certain sounds.

I am adding these APIs back in this manner because a quick solution was needed; one of the devs who stepped down agreed to review my pull request as the last thing before they go.

# Can I use these APIs for my own plugin?
Yes and no. Feel free to use them, but please be aware that they may be deprecated at any time.

These files simply define an interface that typescript recognizes, for the objects that already exist in Highspell. It's like a manual mapping of what Reflector does automatically.

# Important Note for future developers
This will probably re-factored back into the core API, once I get a chance. -- Bpcooldude