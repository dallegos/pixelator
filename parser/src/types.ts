import ora from 'ora';

export type FolderType = {
  name: string;
  files: FileType[];
};

export type FileType = {
  name: string;
  img: string;
  css: string;
};

export type ParseImageOptions = {
  help?: boolean;
  name?: string;
  rows: number;
  cols: number;
  output: string;
  cssOutputFolder: string;
  imgOutputFolder: string;
  jsonOutputFolder: string;
  inputFolder: string;
  inputFile?: string;
  verbose?: boolean;
  output_path?: string;
  cssPath?: string;
  imgPath?: string;
  jsonPath?: string;
  spinner?: ora.Ora;
  structure?: FolderType[];
};
