require 'optparse'
require 'time'
require 'tempfile'
require 'fileutils'
require 'shellwords'

def parse_options
  options = {}

  OptionParser.new do |opts|
    opts.banner = "Usage: ruby concat_with_chapters.rb -i INPUT_DIR -o OUTPUT_FILE (must be .mp4)"

    opts.on("-i", "--input DIR", "Input directory containing .wav files") do |dir|
      options[:input_dir] = File.expand_path(dir)
    end

    opts.on("-o", "--output FILE", "Output .mp4 file path") do |file|
      options[:output_file] = File.expand_path(file)
    end

    opts.on("-t", "--title TITLE", "ffmetadataのファイル自体のタイトル") do |title|
      options[:file_title] = title
    end

    opts.on("-c", "--chapter-titles FILE", "チャプタータイトル一覧ファイル（1行1タイトル、wavファイル順）") do |file|
      options[:chapter_titles_file] = File.expand_path(file)
    end

    opts.on("-h", "--help", "Show this help message") do
      puts opts
      exit
    end
  end.parse!

  unless options[:input_dir] && options[:output_file]
    abort("Error: both --input and --output are required. Use -h for help.")
  end

  unless Dir.exist?(options[:input_dir])
    abort("Error: input directory does not exist: #{options[:input_dir]}")
  end

  if !(options[:output_file].end_with?(".mp4") || options[:output_file].end_with?(".mkv"))
    abort("Error: output file must have a .mp4 or .mkv extension.")
  end

  options
end

def get_duration(file_path)
  cmd = [
    "ffprobe", "-v", "error",
    "-select_streams", "a:0",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file_path
  ]
  output = `#{cmd.shelljoin}`
  output.to_f
end

def build_chapters_ffmetadata(wav_files, file_title = nil, chapter_titles = nil)
  start_time = 0.0
  lines = [";FFMETADATA1"]
  lines << "title=#{file_title}" if file_title

  wav_files.each_with_index do |file, index|
    duration = get_duration(file)
    start_ms = (start_time * 1000).to_i
    end_ms = ((start_time + duration) * 1000).to_i
    title = if chapter_titles && chapter_titles[index]
      chapter_titles[index].strip
    else
      File.basename(file, ".wav")
    end

    lines << "[CHAPTER]"
    lines << "TIMEBASE=1/1000"
    lines << "START=#{start_ms}"
    lines << "END=#{end_ms}"
    lines << "title=#{title}"
    lines << "[/CHAPTER]"

    start_time += duration
  end

  lines
end

def build_ffmpeg_command(input_files, chapter_file_path, output_path)
  filter = input_files.each_index.map { |i| "[#{i}:a]" }.join + "concat=n=#{input_files.size}:v=0:a=1[outa]"

  cmd = ["ffmpeg"]


  input_files.each do |f|
    cmd << "-i" << f
  end

  cmd += [
    "-f", "ffmetadata",
    "-i", chapter_file_path,
    "-filter_complex", filter,
    "-map", "[outa]",
    "-movflags", "use_metadata_tags",
    "-map_metadata", input_files.size.to_s,
    "-c:a", "aac", "-b:a", "192k",
    output_path
  ]

  puts "ffmpeg command: #{cmd.inspect}"

  cmd
end

def main
  options = parse_options
  input_dir = options[:input_dir]
  output_path = options[:output_file]
  file_title = options[:file_title]
  chapter_titles = nil

  if options[:chapter_titles_file]
    unless File.exist?(options[:chapter_titles_file])
      abort("Error: chapter titles file does not exist: #{options[:chapter_titles_file]}")
    end
    chapter_titles = File.readlines(options[:chapter_titles_file], chomp: true)
  end

  input_files = Dir.glob(File.join(input_dir, "*.wav")).sort
  abort("No .wav files found in #{input_dir}") if input_files.empty?

  if chapter_titles && chapter_titles.size < input_files.size
    abort("Error: チャプタータイトルの数がwavファイル数より少ないです")
  end

  chapter_lines = build_chapters_ffmetadata(input_files, file_title, chapter_titles)

  # チャプター情報を一時ファイルに保存
  chapter_file = File.open(File.join(input_dir, 'chapters.txt'), 'w')
  chapter_file.write(chapter_lines.join("\n"))
  chapter_file.flush

  cmd = build_ffmpeg_command(input_files, chapter_file.path, output_path)
  puts "Running ffmpeg to create: #{output_path} ..."
  success = system(*cmd)

  chapter_file.close

  puts success ? "Done!" : "ffmpeg failed."
end

main if __FILE__ == $PROGRAM_NAME
