#!/usr/bin/env ruby
# 使い方: ruby rename_by_chapters.rb -t <章タイトルファイル> -d <wavファイルディレクトリ>
# 章タイトルファイル: 各行が章タイトル（順番通り）
# wavファイルディレクトリ: リネーム対象のwavファイルが格納されたディレクトリ

require 'fileutils'
require 'optparse'

def safe_filename(name)
  name.gsub(/[\\\/:*?"<>|]/, '_')
end

def main
  options = {}
  opt = OptionParser.new do |opts|
    opts.banner = "使い方: ruby rename_by_chapters.rb -t <章タイトルファイル> -d <wavファイルディレクトリ>"

    opts.on('-t', '--title FILE', '章タイトルファイル') { |v| options[:title_file] = v }
    opts.on('-d', '--dir DIR', 'wavファイルディレクトリ') { |v| options[:wav_dir] = v }
    opts.on('-h', '--help', 'ヘルプを表示') do
      puts opts
      exit
    end
  end

  begin
    opt.parse!
  rescue OptionParser::InvalidOption => e
    puts e
    puts opt
    exit 1
  end

  unless options[:title_file] && options[:wav_dir]
    puts opt
    exit 1
  end

  title_file = options[:title_file]
  wav_dir = options[:wav_dir]

  unless File.exist?(title_file)
    puts "章タイトルファイルが見つかりません: #{title_file}"
    exit 1
  end

  unless Dir.exist?(wav_dir)
    puts "ディレクトリが見つかりません: #{wav_dir}"
    exit 1
  end

  # 章タイトルを配列で取得
  chapter_titles = File.readlines(title_file, chomp: true).map(&:strip).reject(&:empty?)

  # ディレクトリ内のwavファイル一覧を取得（ソートして順番を揃える）
  wav_files = `ls -tr #{File.join(wav_dir, '*.wav')}`.split("\n")

  if chapter_titles.length != wav_files.length
    puts "章タイトル数(#{chapter_titles.length})とwavファイル数(#{wav_files.length})が一致しません。"
    exit 1
  end

  wav_files.each_with_index do |file, idx|
    title = chapter_titles[idx]
    new_name = safe_filename(title) + '.wav'
    new_path = File.join(wav_dir, new_name)

    if File.exist?(new_path)
      puts "警告: 既に存在するためスキップ: #{new_path}"
      next
    end

    FileUtils.mv(file, new_path)
    puts "#{File.basename(file)} -> #{new_name}"
  end
end

main if __FILE__ == $0
