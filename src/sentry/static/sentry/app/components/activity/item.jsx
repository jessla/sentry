import marked from 'marked';
import React from 'react';

import {CommitLink} from '../../views/releases/releaseCommits';
import Duration from '../../components/duration';
import Avatar from '../../components/avatar';
import {Link} from 'react-router';
import MemberListStore from '../../stores/memberListStore';
import TimeSince from '../../components/timeSince';
import Version from '../../components/version';

import {t, tn, tct} from '../../locale';

const ActivityItem = React.createClass({
  propTypes: {
    clipHeight: React.PropTypes.number,
    defaultClipped: React.PropTypes.bool,
    item: React.PropTypes.object.isRequired,
    orgId: React.PropTypes.string.isRequired
  },

  getDefaultProps() {
    return {
      defaultClipped: false,
      clipHeight: 68
    };
  },

  getInitialState() {
    return {
      clipped: this.props.defaultClipped
    };
  },

  componentDidMount() {
    if (this.refs.activityBubble) {
      let bubbleHeight = this.refs.activityBubble.offsetHeight;

      if (bubbleHeight > this.props.clipHeight) {
        /*eslint react/no-did-mount-set-state:0*/
        // okay if this causes re-render; cannot determine until
        // rendered first anyways
        this.setState({
          clipped: true
        });
      }
    }
  },

  formatProjectActivity(author, item) {
    let data = item.data;
    let orgId = this.props.orgId;
    let project = item.project;
    let issue = item.issue;
    let issueLink = issue
      ? <Link to={`/${orgId}/${project.slug}/issues/${issue.id}/`}>{issue.shortId}</Link>
      : null;

    switch (item.type) {
      case 'note':
        return tct('[author] commented on [issue]', {
          author: author,
          issue: (
            <Link
              to={`/${orgId}/${project.slug}/issues/${issue.id}/activity/#event_${item.id}`}>
              {issue.shortId}
            </Link>
          )
        });
      case 'set_resolved':
        return tct('[author] marked [issue] as resolved', {
          author: author,
          issue: issueLink
        });
      case 'set_resolved_by_age':
        return tct('[author] marked [issue] as resolved due to age', {
          author: author,
          issue: issueLink
        });
      case 'set_resolved_in_release':
        if (data.version) {
          return tct('[author] marked [issue] as resolved in [version]', {
            author: author,
            version: (
              <Version version={data.version} orgId={orgId} projectId={project.slug} />
            ),
            issue: issueLink
          });
        }
        return tct('[author] marked [issue] as resolved in the upcoming release', {
          author: author,
          issue: issueLink
        });
      case 'set_resolved_in_commit':
        return tct('[author] marked [issue] as fixed in [version]', {
          author: author,
          version: (
            <CommitLink
              inline={true}
              commitId={data.commit.id}
              repository={data.commit.repository}
            />
          ),
          issue: issueLink
        });
      case 'set_unresolved':
        return tct('[author] marked [issue] as unresolved', {
          author: author,
          issue: issueLink
        });
      case 'set_ignored':
        if (data.ignoreDuration) {
          return tct('[author] ignored [issue] for [duration]', {
            author: author,
            duration: <Duration seconds={data.ignoreDuration * 60} />,
            issue: issueLink
          });
        }
        return tct('[author] ignored [issue]', {
          author: author,
          issue: issueLink
        });
      case 'set_public':
        return tct('[author] made an [issue] public', {
          author: author,
          issue: issueLink
        });
      case 'set_private':
        return tct('[author] made an [issue] private', {
          author: author,
          issue: issueLink
        });
      case 'set_regression':
        if (data.version) {
          return tct('[author] marked [issue] as a regression in [version]', {
            author: author,
            version: (
              <Version version={data.version} orgId={orgId} projectId={project.slug} />
            ),
            issue: issueLink
          });
        }
        return tct('[author] marked [issue] as a regression', {
          author: author,
          issue: issueLink
        });
      case 'create_issue':
        return tct('[author] linked [issue] on [provider]', {
          author: author,
          provider: data.provider,
          issue: issueLink
        });
      case 'unmerge_destination':
        return tn(
          '%2$s migrated %1$d fingerprint from %3$s to %4$s',
          '%2$s migrated %1$d fingerprints from %3$s to %4$s',
          data.fingerprints.length,
          author,
          data.source
            ? <a href={`/${orgId}/${project.slug}/issues/${data.source.id}`}>
                {data.source.shortId}
              </a>
            : t('a group'),
          issueLink
        );
      case 'first_seen':
        return tct('[author] saw [link:issue]', {
          author: author,
          issue: issueLink
        });
      case 'assigned':
        let assignee;
        if (item.user && data.assignee === item.user.id) {
          return tct('[author] assigned [issue] to themselves', {
            author: author,
            issue: issueLink
          });
        }
        assignee = MemberListStore.getById(data.assignee);
        if (assignee && assignee.email) {
          return tct('[author] assigned [issue] to [assignee]', {
            author: author,
            assignee: <span title={assignee.email}>{assignee.name}</span>,
            issue: issueLink
          });
        } else if (data.assigneeEmail) {
          return tct('[author] assigned [issue] to [assignee]', {
            author: author,
            assignee: data.assigneeEmail,
            issue: issueLink
          });
        }
        return tct('[author] assigned [issue] to an [help:unknown user]', {
          author: author,
          help: <span title={data.assignee} />,
          issue: issueLink
        });
      case 'unassigned':
        return tct('[author] unassigned [issue]', {
          author: author,
          issue: issueLink
        });
      case 'merge':
        return tct('[author] merged [count] [link:issues]', {
          author: author,
          count: data.issues.length + 1,
          link: <Link to={`/${orgId}/${project.slug}/issues/${issue.id}/`} />
        });
      case 'release':
        return tct('[author] released version [version]', {
          author: author,
          version: (
            <Version version={data.version} orgId={orgId} projectId={project.slug} />
          )
        });
      case 'deploy':
        return tct('[author] deployed version [version] to [environment].', {
          author: author,
          version: (
            <Version version={data.version} orgId={orgId} projectId={project.slug} />
          ),
          environment: data.environment || 'Default Environment'
        });
      default:
        return ''; // should never hit (?)
    }
  },

  render() {
    let item = this.props.item;
    let orgId = this.props.orgId;

    let bubbleClassName = 'activity-item-bubble';
    if (this.state.clipped) {
      bubbleClassName += ' clipped';
    }

    let avatar = item.user
      ? <Avatar user={item.user} size={64} className="avatar" />
      : <div className="avatar sentry"><span className="icon-sentry-logo" /></div>;

    let author = {
      name: item.user ? item.user.name : 'Sentry',
      avatar: avatar
    };

    if (item.type === 'note') {
      let noteBody = marked(item.data.text);
      return (
        <li className="activity-item activity-item-compact">
          <div className="activity-item-content">
            {this.formatProjectActivity(
              <span>
                {author.avatar}
                <span className="activity-author">{author.name}</span>
              </span>,
              item
            )}
            <div
              className={bubbleClassName}
              ref="activityBubble"
              dangerouslySetInnerHTML={{__html: noteBody}}
            />
            <div className="activity-meta">
              <Link className="project" to={`/${orgId}/${item.project.slug}/`}>
                {item.project.name}
              </Link>
              <span className="bullet" />
              <TimeSince date={item.dateCreated} />
            </div>
          </div>
        </li>
      );
    } else if (item.type === 'create_issue') {
      return (
        <li className="activity-item activity-item-compact">
          <div className="activity-item-content">
            {this.formatProjectActivity(
              <span>
                {author.avatar}
                <span className="activity-author">{author.name}</span>
              </span>,
              item
            )}
            <div className="activity-item-bubble">
              <a href={item.data.location}>{item.data.title}</a>
            </div>
            <div className="activity-meta">
              <Link className="project" to={`/${orgId}/${item.project.slug}/`}>
                {item.project.name}
              </Link>
              <span className="bullet" />
              <TimeSince date={item.dateCreated} />
            </div>
          </div>
        </li>
      );
    } else {
      return (
        <li className="activity-item activity-item-compact">
          <div className="activity-item-content">
            {this.formatProjectActivity(
              <span>
                {author.avatar}
                <span className="activity-author">{author.name}</span>
              </span>,
              item
            )}
            <div className="activity-meta">
              <Link className="project" to={`/${orgId}/${item.project.slug}/`}>
                {item.project.name}
              </Link>
              <span className="bullet" />
              <TimeSince date={item.dateCreated} />
            </div>
          </div>
        </li>
      );
    }
  }
});

export default ActivityItem;
