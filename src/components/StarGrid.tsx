import type { StarProject } from '../data/content'

interface Props {
  stars: StarProject[]
}

export function StarGrid({ stars }: Props) {
  return (
    <div className="star-grid">
      {stars.map((star) => (
        <a className="star-card" href={`https://github.com/${star.name}`} target="_blank" rel="noopener noreferrer" key={star.name}>
          <div><span className="rank">#{star.rank}</span></div>
          <span className="num">★ 本周新建累计 {star.stars}</span>
          <h3>{star.name}</h3>
          <p>{star.desc}</p>
          <div className="tags">
            {star.tags.map((tag) => <span className={`tag${/前沿|累计/.test(tag) ? ' hot' : ''}`} key={tag}>{tag}</span>)}
          </div>
        </a>
      ))}
    </div>
  )
}
