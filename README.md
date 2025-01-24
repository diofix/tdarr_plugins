# Downmix Plugin for Tdarr

This is a plugin for [Tdarr](https://github.com/HaveAGitGat/Tdarr) please refer to the [docs](https://docs.tdarr.io/) for setup.

This plugin will add a new 2 channel audio track that is downmixed from the multi-channel/surround sound track.

All audio and subtitle tracks will copied over without any transcoding.

## Background

This was built as in the past my TV could not decode surround sound, so whenever I would try watch something it would attempt to push the surround audio track through the 2 horrible TV speakers, making dialogue difficult to hear and loud sounds (like explosions) overly loud.

## Filter Options

There are currently 3 filter options. These are percentage of the multi-channel track volumes being mapped into a 2 channels (Left/Right).

The values are:

- **FL & FR**: Front Left & Front Right
- **FC**: Front Center
- **RL & RR**: Rear Left & Rear Right (5.1 & 7.1)
- **SL && SR**: Side Left & Side Right (7.1 only)
- **LFE**: Low Pass channel (subwoofer)

Each channel value can be multipled by a value to adjust it's relative volume.

- `1` = Same volume as original
- `<1` = Lower volume than original
- `>1` = Higher volume than original

Using this there are 3 algorithms that seem to sound the best (to me).

**\*Note:** These are not my algorithms I found them online, all credit to the much smarter people that figured them out :)\*

#### Standard

     FL=0.5*FC+0.707*FL+0.707*BL+0.5*LFE|FR=0.5*FC+0.707*FR+0.707*BR+0.5*LFE

#### Dave_750

      FL=0.5*FC+0.707*FL+0.707*BL+0.707*SL+0.5*LFE|FR=0.5*FC+0.707*FR+0.707*BR+0.707*SR+0.5*LFE,

#### RFC_7854:

      FL=0.374107*FC+0.529067*FL+0.458186*BL+0.458186*SL+0.264534*BR+0.264534*SR+0.374107*LFE|FR=0.374107*FC+0.529067*FR+0.458186*BR+0.458186*SR+0.264534*BL+0.264534*SL+0.374107*LFE,
