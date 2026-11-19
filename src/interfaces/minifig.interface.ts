import type { Element } from "./element.interface";

export interface MinifigInterface {
  id: number;
  set_num: string;
  set_name: string;
  quantity: number;
  set_img_url: string;
  pieces?: {
    count: number;
    results: Element[];
  };
}
