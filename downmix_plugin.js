const details = () => ({
  id: "nuDRxI3kU",
  Name: "FFMPEG Downmix to Two Channel",
  Type: "Audio",
  Operation: "Transcode",
  Description:
    "Downmix 5.1 to Stereo 2 channel using custom algorithm(s) for better sound quality (and bass!). Currently only supports downmixing the main (first/default) audio channel.",
  Version: "0.0.1",
  Link: "",
  Tags: "James_Working",
  Inputs: [
    {
      name: "filterFormat",
      type: "string",
      defaultValue: "Standard",
      inputUI: {
        type: "dropdown",
        options: ["Standard", "RFC_7854", "Dave_750"],
      },
      tooltip: "Select the desired downmixing algorithm",
    },
    {
      name: "volumeLevel",
      type: "number",
      defaultValue: 1.6,
      inputUI: {
        type: "text",
      },
      tooltip:
        "Adjust the final volume level for the downmixed track (default is 1.6)",
    },
  ],
})

const buildFilterCommand = (filterFormat, volumeLevel) => {
  // Algorithms that can be used to downmix (or combine) 5.1/7.1 channel audio streams into 2 (L/R) channels.
  const filters = {
    Standard:
      "FL=0.5*FC+0.707*FL+0.707*BL+0.5*LFE|FR=0.5*FC+0.707*FR+0.707*BR+0.5*LFE",
    Dave_750:
      "FL=0.5*FC+0.707*FL+0.707*BL+0.707*SL+0.5*LFE|FR=0.5*FC+0.707*FR+0.707*BR+0.707*SR+0.5*LFE",
    RFC_7854:
      "FL=0.374107*FC+0.529067*FL+0.458186*BL+0.458186*SL+0.264534*BR+0.264534*SR+0.374107*LFE|FR=0.374107*FC+0.529067*FR+0.458186*BR+0.458186*SR+0.264534*BL+0.264534*SL+0.374107*LFE",
  }

  const filterConfig = `pan=stereo|${filters[filterFormat]},volume=${volumeLevel}`

  return `<io>-filter_complex "[0:a:0]${filterConfig}[filtered]"`
}

const buildAudioStreamMapCommand = (audioStreams) => {
  // Copy first audio track to retain the original surround track
  const mapMainAudioTrackCommand = `-map 0:a:0 -c:a:0 copy `

  // Add new downmix track in after original surround track
  const mapNewDownmixChannelCommand = `-map [filtered] -c:a:1 ac3 -b:a:1 192k -metadata:s:a:1 title=Downmix -metadata:s:a:1 language=eng`

  // Remove first surround track as already copied
  audioStreams.shift()
  // Map remanining audio tracks after the new downmix track we've inserted
  const mappedRemainingAudioTracks =
    audioStreams.length > 0
      ? audioStreams
          .map((_, index) => `-map 0:a:${index + 1} -c:a:${index + 2} copy`)
          .join(" ")
      : ""

  return [
    mapMainAudioTrackCommand,
    mapNewDownmixChannelCommand,
    mappedRemainingAudioTracks,
  ].join(" ")
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, rawInputs, otherArguments) => {
  const importFresh = require("import-fresh")
  const library = importFresh("../methods/library.js")
  const inputs = library.loadDefaultValues(rawInputs, details)
  const hasMultiChannelAudio = false
  const audioStreams = []

  file.ffProbeData.streams.forEach((stream) => {
    try {
      if (stream.codec_type.toLowerCase() === "audio") {
        if (stream.channels === 2 && stream.tags.title === "Downmix") {
          // If already downmixed - skip
          return {
            processFile: false,
            infoLog: "Already Dowmixed - skipping",
          }
        }
        if (streams.channels > 2) hasMultiChannelAudio = true
        audioStreams.push(stream)
      }
    } catch (err) {
      return {
        processFile: false,
        infoLog: `Error reading file streams`,
      }
    }
  })

  // If no multichannel audio skip - no need to downmix
  if (!hasMultiChannelAudio) {
    return {
      processFile: false,
      infoLog: `Error - no multi-channel audio track found.`,
    }
  }

  const filterCommand = buildFilterCommand(
    inputs.filterFormat,
    inputs.volumeLevel
  )

  const mapVideoChannels = "-map 0:v -c:v copy"
  const mapAudioChannels = buildAudioStreamMapCommand(audioStreams)
  const mapSubtitleChannels = "-map 0:s? -c:s copy`"

  const ffmpegCommand = `${filterCommand} ${mapVideoChannels} ${mapAudioChannels} ${mapSubtitleChannels}`

  return {
    preset: ffmpegCommand,
    container: ".mkv",
    handbrakeMode: false,
    ffmpegMode: true,
    processFile: true,
    infoLog: "File is being downmixed \n",
  }
}

module.exports.details = details
module.exports.plugin = plugin
