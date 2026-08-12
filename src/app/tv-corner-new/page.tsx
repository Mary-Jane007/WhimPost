"use client";

const channels = [
  { name: "Moonmere News", tone: "gold" },
  { name: "Hearthwick Classics", tone: "rose" },
  { name: "Bramblewood Picks", tone: "green" },
  { name: "Clover Meadow", tone: "blue" },
  { name: "Forest FM", tone: "lavender" },
];

const queue = [
  { title: "Luna & the Lantern Caravan", meta: "18 min · new" },
  { title: "Moss Hollow Theater", meta: "42 min · tonight" },
  { title: "Wildflower Stories", meta: "8 min · short" },
  { title: "Night Market Live", meta: "22 min · live" },
];

const listeners = [
  "Mira",
  "Juniper",
  "Theo",
  "Pip",
  "Ari",
  "Lark",
  "Nessa",
  "Owen",
];

const activity = [
  "Mira queued a warm-weather short",
  "Juniper dropped a favorite cottage reel",
  "Theo started a new watch party",
  "Forest FM is now playing softly in the background",
];

export default function TvCornerNewPage() {
  return (
    <main className="tv-redesign-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <header className="topbar">
        <div className="brand-wrap">
          <span className="brand-mark">✦</span>
          <div>
            <p className="eyebrow">WhimPost</p>
            <h1>TV Corner</h1>
          </div>
        </div>

        <nav className="top-actions" aria-label="TV navigation">
          <button type="button">Browse</button>
          <button type="button">Rooms</button>
          <button type="button" className="primary-btn">
            Start a watch party
          </button>
        </nav>
      </header>

      <section className="hero-panel">
        <div className="screen-panel">
          <div className="screen-meta">
            <span className="live-pill">live</span>
            <span className="screen-label">Moonmere lounge</span>
          </div>

          <div className="screen-frame">
            <div className="screen-overlay" />
            <div className="screen-art">
              <div className="sun" />
              <div className="hill hill-back" />
              <div className="hill hill-front" />
              <div className="tree tree-left" />
              <div className="tree tree-right" />
              <div className="play-badge">▶</div>
            </div>
          </div>

          <div className="control-row">
            <button type="button" className="control-btn">
              ◀
            </button>
            <button type="button" className="control-btn play-btn">
              ▶
            </button>
            <button type="button" className="control-btn">
              ❚❚
            </button>
            <div className="timeline">
              <span className="time-label">12:48</span>
              <div className="timeline-bar">
                <span className="timeline-fill" />
              </div>
              <span className="time-label">18:02</span>
            </div>
          </div>
        </div>

        <aside className="side-stack">
          <div className="info-card spotlight-card">
            <p className="mini-label">Now playing</p>
            <h2>Lanterns on the Water</h2>
            <p>
              A glowing village tale from Moonmere, drifting softly through the
              evening.
            </p>
            <div className="meta-row">
              <span>Season 2</span>
              <span>HD</span>
              <span>Family</span>
            </div>
          </div>

          <div className="info-card">
            <p className="mini-label">Tonight&apos;s room</p>
            <div className="room-avatar-row">
              <div className="avatar avatar-gold">M</div>
              <div className="avatar avatar-green">J</div>
              <div className="avatar avatar-rose">T</div>
              <div className="avatar avatar-blue">+4</div>
            </div>
          </div>
        </aside>
      </section>

      <section className="lower-grid">
        <div className="panel channels-panel">
          <div className="panel-header">
            <h3>Channels</h3>
            <button type="button">discover</button>
          </div>

          <div className="channel-list">
            {channels.map((channel) => (
              <button
                key={channel.name}
                type="button"
                className={`channel-pill tone-${channel.tone}`}
              >
                {channel.name}
              </button>
            ))}
          </div>
        </div>

        <div className="panel queue-panel">
          <div className="panel-header">
            <h3>Queue</h3>
            <button type="button">add</button>
          </div>

          <ul className="queue-list">
            {queue.map((item) => (
              <li key={item.title}>
                <span className="queue-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="panel listeners-panel">
          <div className="panel-header">
            <h3>Listening now</h3>
          </div>

          <div className="listener-grid">
            {listeners.map((name, index) => (
              <div key={name} className="listener-pill">
                <span className="listener-bubble">{name[0]}</span>
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="panel-header">
            <h3>Room activity</h3>
          </div>

          <ul className="activity-list">
            {activity.map((event) => (
              <li key={event}>{event}</li>
            ))}
          </ul>
        </div>
      </section>

      <style jsx>{`
        :global(html, body) {
          margin: 0;
          padding: 0;
          background: #0d120f;
        }

        * {
          box-sizing: border-box;
        }

        .tv-redesign-shell {
          position: relative;
          min-height: 100vh;
          padding: 2rem clamp(1rem, 2vw, 2rem) 3rem;
          background:
            radial-gradient(circle at top left, rgba(221, 176, 93, 0.18), transparent 25%),
            radial-gradient(circle at bottom right, rgba(147, 154, 118, 0.2), transparent 30%),
            linear-gradient(160deg, #0b120d 0%, #111b16 38%, #17271d 100%);
          color: #f7f0df;
          overflow: hidden;
          font-family: Georgia, "Times New Roman", serif;
        }

        .ambient {
          position: absolute;
          border-radius: 50%;
          filter: blur(90px);
          opacity: 0.42;
          pointer-events: none;
        }

        .ambient-one {
          width: 26rem;
          height: 26rem;
          background: rgba(188, 144, 73, 0.28);
          top: -7rem;
          left: -5rem;
        }

        .ambient-two {
          width: 32rem;
          height: 32rem;
          background: rgba(88, 130, 101, 0.22);
          right: -8rem;
          bottom: -8rem;
        }

        .topbar,
        .hero-panel,
        .lower-grid {
          position: relative;
          z-index: 1;
        }

        .topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          max-width: 1320px;
          margin: 0 auto 1.6rem;
        }

        .brand-wrap {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .brand-mark {
          display: grid;
          place-items: center;
          width: 2.8rem;
          height: 2.8rem;
          border-radius: 50%;
          background: linear-gradient(180deg, #f4d98a, #d8b663);
          color: #1a2018;
          font-size: 1.4rem;
          box-shadow: 0 0 24px rgba(231, 197, 113, 0.4);
        }

        .eyebrow {
          margin: 0;
          font-size: 0.72rem;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: rgba(247, 240, 223, 0.72);
        }

        h1 {
          margin: 0;
          font-size: clamp(2rem, 4vw, 3.2rem);
          line-height: 1;
          letter-spacing: -0.05em;
        }

        .top-actions {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          flex-wrap: wrap;
        }

        .top-actions button,
        .panel-header button,
        .control-btn,
        .channel-pill {
          border: 1px solid rgba(255, 255, 255, 0.16);
          background: rgba(17, 24, 20, 0.45);
          color: #f5ead2;
          border-radius: 999px;
          padding: 0.72rem 1.15rem;
          font-size: 0.82rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease,
            background 0.2s ease;
        }

        .top-actions button:hover,
        .panel-header button:hover,
        .control-btn:hover,
        .channel-pill:hover {
          transform: translateY(-1px);
          border-color: rgba(255, 219, 139, 0.5);
        }

        .primary-btn {
          background: linear-gradient(180deg, #f3d180, #d4a85d);
          color: #141d18;
          border: none;
          box-shadow: 0 10px 22px rgba(228, 178, 93, 0.4);
        }

        .hero-panel {
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.8fr);
          gap: 1.5rem;
        }

        .screen-panel {
          padding: 1.3rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 2rem;
          background: rgba(10, 16, 13, 0.7);
          box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06),
            0 20px 40px rgba(0, 0, 0, 0.24);
        }

        .screen-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          margin-bottom: 0.9rem;
        }

        .live-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          color: #f5d98a;
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .live-pill::before {
          content: "";
          width: 0.55rem;
          height: 0.55rem;
          border-radius: 50%;
          background: #ee7a5b;
          box-shadow: 0 0 14px rgba(238, 122, 91, 0.8);
        }

        .screen-label {
          color: rgba(247, 240, 223, 0.7);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-size: 0.72rem;
        }

        .screen-frame {
          position: relative;
          border-radius: 1.65rem;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
          background: linear-gradient(180deg, #1d332a 0%, #11251d 100%);
          aspect-ratio: 16 / 9;
        }

        .screen-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(4, 11, 9, 0.12), rgba(4, 11, 9, 0.5));
          z-index: 1;
        }

        .screen-art {
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 25%, rgba(244, 224, 153, 0.7), transparent 24%),
            linear-gradient(180deg, #294937 0%, #0d1b16 100%);
        }

        .sun {
          position: absolute;
          width: 8rem;
          height: 8rem;
          border-radius: 50%;
          right: 12%;
          top: 9%;
          background: radial-gradient(circle, rgba(255, 228, 148, 1) 0%, rgba(255, 194, 108, 0.8) 48%, rgba(255, 194, 108, 0) 100%);
          box-shadow: 0 0 38px rgba(255, 208, 111, 0.38);
        }

        .hill {
          position: absolute;
          left: -10%;
          right: -10%;
          border-radius: 50% 50% 0 0;
        }

        .hill-back {
          bottom: 18%;
          height: 38%;
          background: rgba(28, 48, 41, 0.8);
        }

        .hill-front {
          bottom: -4%;
          height: 32%;
          background: rgba(15, 29, 24, 0.9);
        }

        .tree {
          position: absolute;
          bottom: 12%;
          width: 5rem;
          height: 8rem;
          background: linear-gradient(180deg, rgba(21, 35, 28, 1), rgba(11, 17, 15, 1));
          clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
          opacity: 0.9;
        }

        .tree-left {
          left: 18%;
        }

        .tree-right {
          right: 18%;
        }

        .play-badge {
          position: absolute;
          z-index: 2;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 6rem;
          height: 6rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: rgba(16, 20, 17, 0.38);
          backdrop-filter: blur(6px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          font-size: 2rem;
          color: #f7f0df;
        }

        .control-row {
          display: flex;
          align-items: center;
          gap: 0.9rem;
          margin-top: 1rem;
        }

        .control-btn {
          width: 2.8rem;
          height: 2.8rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          padding: 0;
        }

        .play-btn {
          width: 3.35rem;
          height: 3.35rem;
          background: linear-gradient(180deg, #f3d180, #d4a85d);
          color: #1a2018;
          border: none;
          box-shadow: 0 10px 22px rgba(231, 183, 95, 0.35);
        }

        .timeline {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .time-label {
          font-size: 0.72rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(247, 240, 223, 0.72);
        }

        .timeline-bar {
          position: relative;
          flex: 1;
          height: 0.6rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.12);
          overflow: hidden;
        }

        .timeline-fill {
          position: absolute;
          inset: 0 auto 0 0;
          width: 48%;
          background: linear-gradient(90deg, #e9c56a, #f0dba2);
          border-radius: inherit;
        }

        .side-stack {
          display: grid;
          gap: 1rem;
        }

        .info-card {
          padding: 1.2rem 1.1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1.4rem;
          background: rgba(17, 24, 20, 0.62);
        }

        .spotlight-card {
          background: linear-gradient(180deg, rgba(27, 36, 29, 0.9), rgba(11, 17, 15, 0.68));
        }

        .mini-label {
          margin: 0 0 0.7rem;
          font-size: 0.68rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(247, 240, 223, 0.66);
        }

        h2 {
          margin: 0 0 0.55rem;
          font-size: clamp(1.5rem, 3vw, 2.2rem);
          line-height: 1.05;
        }

        .info-card p {
          margin: 0;
          color: rgba(247, 240, 223, 0.78);
        }

        .meta-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        .meta-row span {
          padding: 0.38rem 0.65rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.06);
          font-size: 0.7rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .room-avatar-row {
          display: flex;
          align-items: center;
          margin-top: 0.5rem;
        }

        .avatar {
          width: 2.45rem;
          height: 2.45rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          font-size: 0.72rem;
          font-weight: 700;
          border: 2px solid rgba(11, 17, 15, 0.9);
          margin-left: -0.45rem;
          color: #102018;
        }

        .avatar:first-child {
          margin-left: 0;
        }

        .avatar-gold { background: #f3d180; }
        .avatar-green { background: #9cc0a0; }
        .avatar-rose { background: #d7b39e; }
        .avatar-blue { background: #b9c3d8; }

        .lower-grid {
          max-width: 1320px;
          margin: 1.5rem auto 0;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .panel {
          padding: 1.1rem 1rem 1rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 1.5rem;
          background: rgba(16, 23, 19, 0.64);
        }

        .panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.8rem;
          margin-bottom: 0.95rem;
        }

        .panel-header h3 {
          margin: 0;
          font-size: 1.1rem;
        }

        .panel-header button {
          padding: 0.4rem 0.8rem;
          font-size: 0.62rem;
        }

        .channel-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.7rem;
        }

        .channel-pill {
          padding: 0.7rem 0.85rem;
          font-size: 0.7rem;
          letter-spacing: 0.06em;
          text-transform: none;
          text-align: left;
        }

        .tone-gold { border-color: rgba(236, 196, 93, 0.4); }
        .tone-rose { border-color: rgba(214, 160, 123, 0.4); }
        .tone-green { border-color: rgba(136, 176, 132, 0.4); }
        .tone-blue { border-color: rgba(145, 171, 205, 0.4); }
        .tone-lavender { border-color: rgba(180, 170, 214, 0.4); }

        .queue-list,
        .activity-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          gap: 0.8rem;
        }

        .queue-list li {
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
          padding-bottom: 0.7rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .queue-list li:last-child {
          padding-bottom: 0;
          border-bottom: none;
        }

        .queue-dot {
          width: 0.7rem;
          height: 0.7rem;
          border-radius: 50%;
          background: linear-gradient(180deg, #ecce78, #d1a35b);
          margin-top: 0.3rem;
          box-shadow: 0 0 16px rgba(236, 196, 93, 0.7);
        }

        .queue-list strong,
        .activity-list li {
          display: block;
          color: #f0e6d0;
        }

        .queue-list small {
          display: block;
          margin-top: 0.2rem;
          color: rgba(247, 240, 223, 0.64);
          letter-spacing: 0.04em;
        }

        .listener-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.7rem;
        }

        .listener-pill {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 0.6rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.8rem;
        }

        .listener-bubble {
          width: 1.7rem;
          height: 1.7rem;
          border-radius: 50%;
          display: grid;
          place-items: center;
          background: linear-gradient(180deg, #dfd0a2, #c7a96d);
          color: #172119;
          font-size: 0.72rem;
          font-weight: 700;
        }

        .activity-list li {
          position: relative;
          padding-left: 1rem;
          line-height: 1.5;
          color: rgba(247, 240, 223, 0.78);
        }

        .activity-list li::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0.5rem;
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: #d7b669;
        }

        @media (max-width: 980px) {
          .hero-panel {
            grid-template-columns: 1fr;
          }

          .lower-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 640px) {
          .topbar {
            flex-direction: column;
            align-items: flex-start;
          }

          .lower-grid {
            grid-template-columns: 1fr;
          }

          .top-actions {
            width: 100%;
          }

          .top-actions button {
            flex: 1 1 auto;
          }
        }
      `}</style>
    </main>
  );
}
