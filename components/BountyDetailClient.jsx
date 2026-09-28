'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  db,
  auth,
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  updateDoc,
  serverTimestamp,
  onAuthStateChanged
} from '@/lib/firebase';

export default function BountyDetailClient() {
  const params = useParams();
  const router = useRouter();
  const bountyId = params?.id;

  const [bounty, setBounty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  // Submission state
  const [workLink, setWorkLink] = useState('');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subSuccess, setSubSuccess] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);

  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, async u => {
      setCurrentUser(u);
      if (u && db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', u.uid));
          if (uSnap.exists()) setUserProfile(uSnap.data());

          // Check if already submitted
          if (bountyId) {
            const mySubSnap = await getDocs(query(
              collection(db, 'bounty_submissions'),
              where('bounty_id', '==', bountyId),
              where('user_id', '==', u.uid)
            ));
            if (!mySubSnap.empty) {
              setExistingSubmission(mySubSnap.docs[0].data());
            }
          }
        } catch (e) {}
      }
    });
    return () => unsub();
  }, [bountyId]);

  useEffect(() => {
    async function fetchBounty() {
      if (!db || !bountyId) return;
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'bounties', bountyId));
        if (snap.exists()) {
          setBounty({ id: snap.id, ...snap.data() });
        }
      } catch (err) {
        console.error('Error fetching bounty detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBounty();
  }, [bountyId]);

  async function handleSubmitWork(e) {
    e.preventDefault();
    if (!workLink) return;
    if (!currentUser) {
      router.push(`/login?redirect=/bounties/${bountyId}`);
      return;
    }

    setSubmitting(true);
    try {
      const subData = {
        bounty_id: bountyId,
        bounty_title: bounty.title,
        user_id: currentUser.uid,
        user_name: userProfile ? `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() : currentUser.email,
        user_email: currentUser.email,
        work_link: workLink.trim(),
        notes: submissionNotes.trim(),
        status: 'submitted',
        submitted_at: serverTimestamp(),
      };

      await addDoc(collection(db, 'bounty_submissions'), subData);

      // Increment applicants count
      try {
        await updateDoc(doc(db, 'bounties', bountyId), {
          applicants_count: (Number(bounty.applicants_count) || 0) + 1,
        });
      } catch (eCnt) {}

      setExistingSubmission(subData);
      setSubSuccess(true);
    } catch (err) {
      console.error('Error submitting bounty work:', err);
      alert('Failed to submit: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
        Loading bounty details…
      </div>
    );
  }

  if (!bounty) {
    return (
      <div style={{ minHeight: '70vh', padding: '10rem 5vw', textAlign: 'center' }}>
        <h2>Bounty Not Found</h2>
        <p style={{ color: 'var(--muted)', marginTop: '.5rem', marginBottom: '2rem' }}>This quest may have expired or been removed.</p>
        <Link href="/bounties" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>← Back to All Bounties</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '8rem 5vw 6rem' }}>
      <Link href="/bounties" style={{ color: 'var(--muted)', fontSize: '.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1.5rem' }}>
        ← Back to Bounties
      </Link>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ background: 'rgba(20,40,255,.15)', color: '#6b8cff', padding: '.3rem .8rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase' }}>
              {bounty.category || 'General'}
            </span>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--white)', marginTop: '.8rem', marginBottom: '.4rem' }}>
              {bounty.title}
            </h1>
            <div style={{ fontSize: '.85rem', color: 'var(--muted)' }}>
              Posted by {bounty.creator_name || 'Protocol Partner'} &middot; {bounty.deadline ? `Deadline: ${bounty.deadline}` : 'Open Deadline'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '.75rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Bounty Reward</div>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--orange)' }}>
              ${(bounty.reward_usd || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.8rem', marginTop: '1.8rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.8rem' }}>Overview &amp; Deliverables</h3>
          <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
            {bounty.description || 'No description provided.'}
          </p>
        </div>

        {bounty.requirements && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.8rem', marginTop: '1.8rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.8rem' }}>Requirements</h3>
            <p style={{ color: 'var(--muted)', fontSize: '.95rem', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {bounty.requirements}
            </p>
          </div>
        )}
      </div>

      {/* SUBMISSION SECTION */}
      <div style={{ background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '16px', padding: '2.5rem' }}>
        <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--white)', marginBottom: '.5rem' }}>Submit Your Contribution</h3>
        <p style={{ color: 'var(--muted)', fontSize: '.85rem', marginBottom: '1.8rem' }}>
          Provide the link to your GitHub repo, pull request, Figma file, or live proof of work.
        </p>

        {existingSubmission ? (
          <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '10px', padding: '1.5rem' }}>
            <div style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem', marginBottom: '.4rem' }}>✓ Work Submitted</div>
            <div style={{ fontSize: '.85rem', color: 'var(--white)', marginBottom: '.4rem' }}>
              <strong>Your Link:</strong> <a href={existingSubmission.work_link} target="_blank" rel="noopener noreferrer" style={{ color: '#6b8cff', textDecoration: 'underline' }}>{existingSubmission.work_link}</a>
            </div>
            <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
              Status: <span style={{ textTransform: 'capitalize', color: 'var(--orange)' }}>{existingSubmission.status || 'Under Review'}</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitWork}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Proof of Work URL (GitHub / Demo / Drive / Figma)</label>
              <input
                type="url"
                required
                value={workLink}
                onChange={e => setWorkLink(e.target.value)}
                placeholder="https://github.com/..."
                style={{ width: '100%', padding: '.8rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '.4rem' }}>Notes / Context (Optional)</label>
              <textarea
                rows={3}
                value={submissionNotes}
                onChange={e => setSubmissionNotes(e.target.value)}
                placeholder="Key highlights or instructions for the reviewers..."
                style={{ width: '100%', padding: '.8rem 1rem', background: 'var(--deep)', border: '1px solid var(--border)', borderRadius: '8px', color: '#fff', fontSize: '.88rem' }}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              style={{ padding: '.85rem 2rem', background: 'var(--blue)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 700, cursor: 'pointer', fontSize: '.95rem' }}
            >
              {submitting ? 'Submitting…' : 'Submit Proof of Work →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
