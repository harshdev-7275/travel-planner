import FirecrawlApp, { CrawlParams, CrawlStatusResponse } from '@mendable/firecrawl-js';


const fireCrawlApp = new FirecrawlApp({apiKey: "fc-1998ec83a6ee42deac473dfbbd687c7f"});

type ScrapeData ={
  title: string,
  description: string,
  url: string,
  markdown: string,
  metadata: {
    description: string,
    sourceURL: string,
    favicon: string
  },
}


export const scrapeResponse = async (query : string)=>{
  try {
    const res = await fireCrawlApp.search(query, {
      limit: 3,
   scrapeOptions: {
    formats: ["markdown", "links"]
  }
    })


    const data: ScrapeData[] = res.data.map((item: any) => {
      return {
        title: item.url,
        description: item.description,
        url: item.url,
        markdown: item.markdown,
        metadata: {
          description: item.description,
          sourceURL: item.url,
          favicon: item.metadata.favicon
        }
      }
    })

    console.log("scrapeResponse", data)
    return res.data
  } catch (error) {
    console.error(error)
  }
}



  // const crawlResponse = await app.crawlUrl('https://firecrawl.dev', {
  //   limit: 100,
  //   scrapeOptions: {
  //     formats: ['markdown', 'html'],
  //   }
  // })