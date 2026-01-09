export interface SearchItem {
    asin: string; 
    title: string;
    img_url: string;
    price: number;
    stars: number;
    reviews: number;
    category_name: string;
}

interface Metadata {
    total: string;
    perf: {
        total: string;
        algo: string;
        db: string;
    };
    query: string;
}


export interface SearchResults {
    meta: Metadata;
    data: SearchItem[];
}

