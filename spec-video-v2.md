# Video studio

- The hierarchy should be  via breadcrumbs not this weird options, clicking on the prev breadcrumbs would take us to correct vie

script
<http://localhost:5173/video/scripts/1771339232541-d3tb0lf>

shot
<http://localhost:5173/video/scripts/1771339232541-d3tb0lf>/<index>

template
<http://localhost:5173/video/scripts/1771339232541-d3tb0lf/templates>

- +add should +template and should actually be modal/dialog so we can maintain the spatial awareness

- there should be a global setting for the narration, default is probably disabled
- the subtitles doesn't look like toggle, make it
- duration of clip, the model config should have durations config and we can pick duration for the clip from the list
- when generating video, the first one is auto-selected
- the script shows video preview for the selected video
- add explainer to the narration - it will overwrite the video
- the script should have like a script settings, <http://localhost:5173/video/scripts/1771339232541-d3tb0lf/>/setttings where we could configure the global narration, subtitles, and any global prompting, anythign that is injected for every shot, this should also support variables
- the narration toggle works that it will enable or disable all individual shot toggles, when there's not clear all disabled, all enabled, there should be like a mixed state, and changing it would reset it
- the narration should be disabled per default
- the AI chat
  - it should get the whole context of the script, including the global settings
  - it should have tools to change shots, change the global settings, it can return multiple tools per call, make it look good with tools
  - you must test it for real, and also generate fixtures
  - it should have tools available to manipulate with everything around script, except of generating stuff for now
- typing {{ doesnt' seem to do anything
