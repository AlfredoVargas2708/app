export interface ColorElement {
  color_id: number;
  color_name: string;
  part_img_url: string;
  part_ids: string[];
  color_rgb: string;
}

export interface ColorSet {
  id: number;
  name: string;
  rgb: string;
}
